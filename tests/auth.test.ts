import { afterEach, describe, mock, test } from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  createClientCredentialsTokenProvider,
  createSatuSehatClient,
  createFileTokenStore,
  createMemoryTokenStore,
  isAccessTokenExpired,
} from "../src";
import { SatuSehatApiError } from "../src/core/errors";
import { expect } from "./helpers/expect";

const tempPaths: string[] = [];

afterEach(async () => {
  await Promise.all(tempPaths.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("token stores", () => {
  test("reuses cached token from memory store while still valid", async () => {
    let callCount = 0;
    const now = 1_000_000;
    const tokenStore = createMemoryTokenStore();
    const provider = createClientCredentialsTokenProvider({
      authBaseUrl: "https://example.com/oauth2/v1",
      clientId: "client-id",
      clientSecret: "client-secret",
      tokenStore,
      now: () => now,
      fetch: mock.fn(async () => {
        callCount += 1;

        return new Response(
          JSON.stringify({
            access_token: "token-123",
            expires_in: 3600,
            token_type: "BearerToken",
            issued_at: String(now),
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      }),
    });

    const first = await provider();
    const second = await provider();

    expect(first).toBe("token-123");
    expect(second).toBe("token-123");
    expect(callCount).toBe(1);
  });

  test("refreshes token when cached token is expired", async () => {
    let now = 10_000;
    let callCount = 0;
    const tokenStore = createMemoryTokenStore({
      accessToken: "stale-token",
      tokenType: "BearerToken",
      issuedAt: 0,
      expiresIn: 60,
      expiresAt: 1_000,
    });
    const provider = createClientCredentialsTokenProvider({
      authBaseUrl: "https://example.com/oauth2/v1",
      clientId: "client-id",
      clientSecret: "client-secret",
      tokenStore,
      now: () => now,
      fetch: mock.fn(async () => {
        callCount += 1;

        return new Response(
          JSON.stringify({
            access_token: "fresh-token",
            expires_in: 3600,
            token_type: "BearerToken",
            issued_at: String(now),
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      }),
    });

    const token = await provider();

    expect(token).toBe("fresh-token");
    expect(callCount).toBe(1);
  });

  test("persists token to file store", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "satusehat-token-store-"));
    tempPaths.push(tempDir);

    const filePath = join(tempDir, "token.json");
    const tokenStore = createFileTokenStore({ filePath });

    await tokenStore.setToken({
      accessToken: "persisted-token",
      tokenType: "BearerToken",
      issuedAt: 1_000,
      expiresIn: 3600,
      expiresAt: 3_601_000,
    });

    const raw = await readFile(filePath, "utf8");
    const saved = JSON.parse(raw) as { accessToken: string };
    const loaded = await tokenStore.getToken();

    expect(saved.accessToken).toBe("persisted-token");
    expect(loaded?.accessToken).toBe("persisted-token");
  });
});

describe("isAccessTokenExpired", () => {
  test("returns false for a token outside safety window", () => {
    expect(
      isAccessTokenExpired(
        { expiresAt: 70_000 },
        {
          now: 10_000,
          safetyWindowMs: 5_000,
        },
      ),
    ).toBe(false);
  });

  test("returns true for a token inside safety window", () => {
    expect(
      isAccessTokenExpired(
        { expiresAt: 12_000 },
        {
          now: 10_000,
          safetyWindowMs: 3_000,
        },
      ),
    ).toBe(true);
  });
});

describe("401 retry flow", () => {
  test("clears cached token and retries once with a fresh token", async () => {
    const farFuture = Date.now() + 60 * 60 * 1_000;
    const tokenStore = createMemoryTokenStore({
      accessToken: "stale-token",
      tokenType: "BearerToken",
      issuedAt: 1_000,
      expiresIn: 3600,
      expiresAt: farFuture,
    });

    let authCallCount = 0;
    let resourceCallCount = 0;

    const client = createSatuSehatClient({
      baseUrl: "https://example.com/fhir-r4/v1",
      authBaseUrl: "https://example.com/oauth2/v1",
      credentials: {
        clientId: "client-id",
        clientSecret: "client-secret",
      },
      tokenStore,
      fetch: mock.fn(async (input, init) => {
        const url = String(input);

        if (url.includes("/accesstoken")) {
          authCallCount += 1;

          return new Response(
            JSON.stringify({
              access_token: "fresh-token",
              expires_in: 3600,
              token_type: "BearerToken",
              issued_at: "1000",
            }),
            {
              status: 200,
              headers: { "content-type": "application/json" },
            },
          );
        }

        resourceCallCount += 1;

        if (resourceCallCount === 1) {
          expect(init?.headers).toMatchObject({
            authorization: "Bearer stale-token",
          });

          return new Response(JSON.stringify({ issue: [{ code: "login" }] }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }

        expect(init?.headers).toMatchObject({
          authorization: "Bearer fresh-token",
        });

        return new Response(
          JSON.stringify({
            resourceType: "Bundle",
            entry: [],
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      }),
    });

    const result = await client.patient.search({
      identifier: "https://fhir.kemkes.go.id/id/nik|1234567890123456",
    });

    expect(result.resourceType).toBe("Bundle");
    expect(resourceCallCount).toBe(2);
    expect(authCallCount).toBe(1);
    expect((await tokenStore.getToken())?.accessToken).toBe("fresh-token");
  });

  test("stops after one retry and surfaces the 401 error", async () => {
    const farFuture = Date.now() + 60 * 60 * 1_000;
    const tokenStore = createMemoryTokenStore({
      accessToken: "cached-token",
      tokenType: "BearerToken",
      issuedAt: 1_000,
      expiresIn: 3600,
      expiresAt: farFuture,
    });

    let authCallCount = 0;
    let resourceCallCount = 0;

    const client = createSatuSehatClient({
      baseUrl: "https://example.com/fhir-r4/v1",
      authBaseUrl: "https://example.com/oauth2/v1",
      credentials: {
        clientId: "client-id",
        clientSecret: "client-secret",
      },
      tokenStore,
      fetch: mock.fn(async (input) => {
        const url = String(input);

        if (url.includes("/accesstoken")) {
          authCallCount += 1;

          return new Response(
            JSON.stringify({
              access_token: "still-bad-token",
              expires_in: 3600,
              token_type: "BearerToken",
              issued_at: "1000",
            }),
            {
              status: 200,
              headers: { "content-type": "application/json" },
            },
          );
        }

        resourceCallCount += 1;

        return new Response(JSON.stringify({ issue: [{ code: "login" }] }), {
          status: 401,
          headers: { "content-type": "application/json" },
        });
      }),
    });

    await expect(
      client.patient.search({
        identifier: "https://fhir.kemkes.go.id/id/nik|1234567890123456",
      }),
    ).rejects.toBeInstanceOf(SatuSehatApiError);

    expect(resourceCallCount).toBe(2);
    expect(authCallCount).toBe(1);
  });
});

import { describe, test } from "node:test";

import { createSatuSehatClient } from "../src";
import { SatuSehatValidationError } from "../src/core/errors";
import { expect } from "./helpers/expect";

describe("practitioner.search", () => {
  test("throws when no required search parameter is provided", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(JSON.stringify({ resourceType: "Bundle", entry: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });

    await expect(client.practitioner.search({} as never)).rejects.toBeInstanceOf(
      SatuSehatValidationError,
    );
  });

  test("returns validated practitioner bundle", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(
          JSON.stringify({
            resourceType: "Bundle",
            total: 1,
            entry: [
              {
                resource: {
                  resourceType: "Practitioner",
                  id: "10009880728",
                  identifier: [
                    {
                      system: "https://fhir.kemkes.go.id/id/nik",
                      value: "7209061211900001",
                    },
                  ],
                  name: [
                    {
                      text: "dr. Alexander",
                    },
                  ],
                  gender: "male",
                  birthDate: "1994-01-01",
                },
              },
            ],
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
    });

    const result = await client.practitioner.search({
      identifier: "https://fhir.kemkes.go.id/id/nik|7209061211900001",
    });

    expect(result.total).toBe(1);
    expect(result.entry?.[0]?.resource.id).toBe("10009880728");
    expect(result.entry?.[0]?.resource.name?.[0]?.text).toBe("dr. Alexander");
  });

  test("gets practitioner by id", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(
          JSON.stringify({
            resourceType: "Practitioner",
            id: "10009880728",
            identifier: [
              {
                system: "https://fhir.kemkes.go.id/id/nik",
                value: "7209061211900001",
              },
            ],
            name: [
              {
                text: "dr. Alexander",
              },
            ],
            gender: "male",
            birthDate: "1994-01-01",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
    });

    const practitioner = await client.practitioner.getById({
      id: "10009880728",
    });

    expect(practitioner.id).toBe("10009880728");
    expect(practitioner.birthDate).toBe("1994-01-01");
  });
});

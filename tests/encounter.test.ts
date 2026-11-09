import { describe, test } from "node:test";

import { createSatuSehatClient, SatuSehatValidationError } from "../src";
import { createEncounterFixture } from "./fixtures/encounter";
import { expect } from "./helpers/expect";

const encounterPayload = createEncounterFixture("outpatient");

describe("encounter endpoint", () => {
  test("validates that search requires subject", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(JSON.stringify({ resourceType: "Bundle", entry: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });

    await expect(client.encounter.search({} as never)).rejects.toBeInstanceOf(
      SatuSehatValidationError,
    );
  });

  test("searches encounter by subject", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (input) => {
        const url = String(input);
        expect(url).toContain("subject=100000030009");

        return new Response(
          JSON.stringify({
            resourceType: "Bundle",
            total: 1,
            entry: [
              {
                resource: {
                  id: "4f735a03-128b-464d-bf91-e6eacdf1c38f",
                  ...encounterPayload,
                },
              },
            ],
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const result = await client.encounter.search({
      subject: "100000030009",
    });

    expect(result.total).toBe(1);
    expect(result.entry?.[0]?.resource.id).toBe("4f735a03-128b-464d-bf91-e6eacdf1c38f");
    expect(result.entry?.[0]?.resource.subject.reference).toBe("Patient/100000030009");
  });

  test("posts a validated encounter resource", async () => {
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        const requestBody = init?.body ? JSON.parse(String(init.body)) : undefined;
        capturedBody = requestBody;

        return new Response(
          JSON.stringify({
            id: "4f735a03-128b-464d-bf91-e6eacdf1c38f",
            ...(requestBody && typeof requestBody === "object" ? requestBody : {}),
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const encounter = await client.encounter.create(encounterPayload);

    expect((capturedBody as { resourceType: string }).resourceType).toBe("Encounter");
    expect(encounter.id).toBe("4f735a03-128b-464d-bf91-e6eacdf1c38f");
    expect(encounter.location[0]?.location.reference).toBe("Location/poli-interna");
    expect(encounter.serviceType?.coding?.[0]?.code).toBe("poli-interna");
  });

  test("patches encounter with replace operations", async () => {
    let capturedMethod: string | undefined;
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        capturedMethod = init?.method;
        capturedBody = init?.body ? JSON.parse(String(init.body)) : undefined;

        return new Response(
          JSON.stringify({
            id: "4f735a03-128b-464d-bf91-e6eacdf1c38f",
            ...encounterPayload,
            status: "finished",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const updated = await client.encounter.patch({
      id: "4f735a03-128b-464d-bf91-e6eacdf1c38f",
      body: [
        {
          op: "replace",
          path: "/status",
          value: "finished",
        },
      ],
    });

    expect(capturedMethod).toBe("PATCH");
    expect(capturedBody).toEqual([
      {
        op: "replace",
        path: "/status",
        value: "finished",
      },
    ]);
    expect(updated.status).toBe("finished");
  });

  test("updates encounter with resource id in body", async () => {
    let capturedMethod: string | undefined;
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        capturedMethod = init?.method;
        capturedBody = init?.body ? JSON.parse(String(init.body)) : undefined;

        return new Response(
          JSON.stringify({
            ...(capturedBody && typeof capturedBody === "object" ? capturedBody : {}),
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const updated = await client.encounter.update({
      id: "4f735a03-128b-464d-bf91-e6eacdf1c38f",
      body: {
        ...encounterPayload,
        id: "4f735a03-128b-464d-bf91-e6eacdf1c38f",
        status: "in-progress",
      },
    });

    expect(capturedMethod).toBe("PUT");
    expect(capturedBody).toMatchObject({
      id: "4f735a03-128b-464d-bf91-e6eacdf1c38f",
      resourceType: "Encounter",
      status: "in-progress",
    });
    expect(updated.id).toBe("4f735a03-128b-464d-bf91-e6eacdf1c38f");
  });
});

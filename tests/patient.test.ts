import { describe, test } from "node:test";

import { createSatuSehatClient } from "../src";
import { SatuSehatValidationError } from "../src/core/errors";
import { expect } from "./helpers/expect";

describe("patient.search", () => {
  test("throws when no required search parameter is provided", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(JSON.stringify({ resourceType: "Bundle", entry: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });

    await expect(client.patient.search({} as never)).rejects.toBeInstanceOf(SatuSehatValidationError);
  });

  test("returns validated patient bundle", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(
          JSON.stringify({
            resourceType: "Bundle",
            entry: [
              {
                resource: {
                  resourceType: "Patient",
                  id: "P001",
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

    const result = await client.patient.search({
      identifier: "https://fhir.kemkes.go.id/id/nik|1234567890123456",
    });

    expect(result.resourceType).toBe("Bundle");
    expect(result.entry?.[0]?.resource.id).toBe("P001");
  });
});

import { describe, test } from "node:test";

import { createSatuSehatClient, SatuSehatValidationError } from "../src";
import { expect } from "./helpers/expect";

describe("practitionerRole endpoint", () => {
  test("validates that search requires practitioner", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(JSON.stringify({ resourceType: "Bundle", entry: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });

    await expect(client.practitionerRole.search({} as never)).rejects.toBeInstanceOf(
      SatuSehatValidationError,
    );
  });

  test("searches practitioner role by practitioner and organization", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (input) => {
        const url = String(input);
        expect(url).toContain("practitioner=10009880728");
        expect(url).toContain("organization=6694e8c8-052a-4ea6-8072-157b6d47ca08");

        return new Response(
          JSON.stringify({
            resourceType: "Bundle",
            total: 1,
            entry: [
              {
                resource: {
                  resourceType: "PractitionerRole",
                  id: "7a44b421-677e-45a1-b7c0-5249264a3189",
                  practitioner: {
                    reference: "Practitioner/10009880728",
                    display: "dr. Alexander",
                  },
                  organization: {
                    reference: "Organization/6694e8c8-052a-4ea6-8072-157b6d47ca08",
                    display: "RS SATUSEHAT",
                  },
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

    const result = await client.practitionerRole.search({
      practitioner: "10009880728",
      organization: "6694e8c8-052a-4ea6-8072-157b6d47ca08",
    });

    expect(result.total).toBe(1);
    expect(result.entry?.[0]?.resource.id).toBe("7a44b421-677e-45a1-b7c0-5249264a3189");
  });

  test("posts a validated practitioner role resource", async () => {
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        const requestBody = init?.body ? JSON.parse(String(init.body)) : undefined;
        capturedBody = requestBody;

        return new Response(
          JSON.stringify({
            id: "7a44b421-677e-45a1-b7c0-5249264a3189",
            ...(requestBody && typeof requestBody === "object" ? requestBody : {}),
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const practitionerRole = await client.practitionerRole.create({
      resourceType: "PractitionerRole",
      practitioner: {
        reference: "Practitioner/10009880728",
        display: "dr. Alexander",
      },
      organization: {
        reference: "Organization/6694e8c8-052a-4ea6-8072-157b6d47ca08",
        display: "RS SATUSEHAT",
      },
      code: [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/practitioner-role",
              code: "doctor",
              display: "Doctor",
            },
          ],
        },
      ],
    });

    expect((capturedBody as { resourceType: string }).resourceType).toBe("PractitionerRole");
    expect(practitionerRole.id).toBe("7a44b421-677e-45a1-b7c0-5249264a3189");
    expect(practitionerRole.practitioner?.reference).toBe("Practitioner/10009880728");
  });

  test("patches practitioner role with replace operations", async () => {
    let capturedMethod: string | undefined;
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        capturedMethod = init?.method;
        capturedBody = init?.body ? JSON.parse(String(init.body)) : undefined;

        return new Response(
          JSON.stringify({
            resourceType: "PractitionerRole",
            id: "7a44b421-677e-45a1-b7c0-5249264a3189",
            availabilityExceptions: "Libur nasional",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const updated = await client.practitionerRole.patch({
      id: "7a44b421-677e-45a1-b7c0-5249264a3189",
      body: [
        {
          op: "replace",
          path: "/availabilityExceptions",
          value: "Libur nasional",
        },
      ],
    });

    expect(capturedMethod).toBe("PATCH");
    expect(capturedBody).toEqual([
      {
        op: "replace",
        path: "/availabilityExceptions",
        value: "Libur nasional",
      },
    ]);
    expect(updated.availabilityExceptions).toBe("Libur nasional");
  });
});

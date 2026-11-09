import { describe, test } from "node:test";

import { createSatuSehatClient, SatuSehatValidationError } from "../src";
import { expect } from "./helpers/expect";

describe("location endpoint", () => {
  test("validates that search requires identifier, name, or organization", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(JSON.stringify({ resourceType: "Bundle", entry: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });

    await expect(client.location.search({} as never)).rejects.toBeInstanceOf(
      SatuSehatValidationError,
    );
  });

  test("searches location by organization", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (input) => {
        const url = String(input);
        expect(url).toContain("organization=54278fdf-57f9-4e6f-aca4-be97ac12a3f7");

        return new Response(
          JSON.stringify({
            resourceType: "Bundle",
            total: 1,
            entry: [
              {
                resource: {
                  resourceType: "Location",
                  id: "3362d984-af65-43ac-8e5c-7db2b3be3f8b",
                  identifier: [
                    {
                      system: "http://sys-ids.kemkes.go.id/location/1000001",
                      value: "G-2-R-1A",
                    },
                  ],
                  status: "active",
                  name: "Ruang 1A IRJT",
                  managingOrganization: {
                    reference: "Organization/54278fdf-57f9-4e6f-aca4-be97ac12a3f7",
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

    const result = await client.location.search({
      organization: "54278fdf-57f9-4e6f-aca4-be97ac12a3f7",
    });

    expect(result.total).toBe(1);
    expect(result.entry?.[0]?.resource.name).toBe("Ruang 1A IRJT");
  });

  test("posts a validated location resource", async () => {
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        const requestBody = init?.body ? JSON.parse(String(init.body)) : undefined;
        capturedBody = requestBody;

        return new Response(
          JSON.stringify({
            id: "3362d984-af65-43ac-8e5c-7db2b3be3f8b",
            ...(requestBody && typeof requestBody === "object" ? requestBody : {}),
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const location = await client.location.create({
      resourceType: "Location",
      identifier: [
        {
          system: "http://sys-ids.kemkes.go.id/location/1000001",
          value: "G-2-R-1A",
        },
      ],
      status: "active",
      name: "Ruang 1A IRJT",
      managingOrganization: {
        reference: "Organization/10000004",
        display: "RS SATUSEHAT",
      },
      physicalType: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/location-physical-type",
            code: "ro",
            display: "Room",
          },
        ],
      },
    });

    expect((capturedBody as { resourceType: string }).resourceType).toBe("Location");
    expect(location.id).toBe("3362d984-af65-43ac-8e5c-7db2b3be3f8b");
    expect(location.physicalType?.coding?.[0]?.code).toBe("ro");
  });

  test("patches a location with replace operations", async () => {
    let capturedMethod: string | undefined;
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        capturedMethod = init?.method;
        capturedBody = init?.body ? JSON.parse(String(init.body)) : undefined;

        return new Response(
          JSON.stringify({
            resourceType: "Location",
            id: "3362d984-af65-43ac-8e5c-7db2b3be3f8b",
            identifier: [
              {
                system: "http://sys-ids.kemkes.go.id/location/1000001",
                value: "G-2-R-1A",
              },
            ],
            status: "active",
            name: "Ruang 1A IRJT",
            description: "Deskripsi terbaru",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const updated = await client.location.patch({
      id: "3362d984-af65-43ac-8e5c-7db2b3be3f8b",
      body: [
        {
          op: "replace",
          path: "/description",
          value: "Deskripsi terbaru",
        },
      ],
    });

    expect(capturedMethod).toBe("PATCH");
    expect(capturedBody).toEqual([
      {
        op: "replace",
        path: "/description",
        value: "Deskripsi terbaru",
      },
    ]);
    expect(updated.description).toBe("Deskripsi terbaru");
  });
});

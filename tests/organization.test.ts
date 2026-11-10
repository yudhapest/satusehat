import { describe, test } from "node:test";

import { createOrganizationBuilder, createSatuSehatClient, SatuSehatValidationError } from "../src";
import { expect } from "./helpers/expect";

describe("organization builder", () => {
  test("adds repeatable fields such as address and alias", () => {
    const builder = createOrganizationBuilder({
      active: true,
      identifier: {
        system: "http://sys-ids.kemkes.go.id/organization/10000004",
        value: "10000004",
      },
      name: "Puskesmas SATUSEHAT",
      type: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/organization-type",
            code: "prov",
            display: "Healthcare Provider",
          },
        ],
      },
    });

    const resource = builder
      .addAlias("PKM SATUSEHAT")
      .addAlias("Primary Clinic SATUSEHAT")
      .addAddress({
        use: "work",
        line: ["Jl. Contoh 1"],
        city: "Jakarta",
        country: "ID",
      })
      .addAddress({
        use: "billing",
        line: ["Jl. Contoh 2"],
        city: "Jakarta",
        country: "ID",
      })
      .build();

    expect(resource.alias).toHaveLength(2);
    expect(resource.address).toHaveLength(2);
    expect(resource.resourceType).toBe("Organization");
  });
});

describe("organization endpoint", () => {
  test("validates that search requires name or partof", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(JSON.stringify({ resourceType: "Bundle", entry: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });

    await expect(client.organization.search({} as never)).rejects.toBeInstanceOf(
      SatuSehatValidationError,
    );
  });

  test("posts a validated organization resource", async () => {
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        const requestBody = init?.body ? JSON.parse(String(init.body)) : undefined;
        capturedBody = requestBody;

        return new Response(
          JSON.stringify({
            id: "38d2fd4d-1402-4e5f-8f09-618fca5ce313",
            ...(requestBody && typeof requestBody === "object" ? requestBody : {}),
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const organization = await client.organization.create(
      createOrganizationBuilder({
        active: true,
        identifier: {
          system: "http://sys-ids.kemkes.go.id/organization/10000004",
          value: "10000004",
        },
        name: "Puskesmas SATUSEHAT",
        type: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/organization-type",
              code: "prov",
              display: "Healthcare Provider",
            },
          ],
        },
      })
        .addTelecom({
          system: "phone",
          value: "0211234567",
          use: "work",
        })
        .addAddress({
          use: "work",
          line: ["Jl. Kebon Jeruk No. 1"],
          city: "Jakarta",
          country: "ID",
        })
        .build(),
    );

    expect((capturedBody as { resourceType: string }).resourceType).toBe("Organization");
    expect(organization.id).toBe("38d2fd4d-1402-4e5f-8f09-618fca5ce313");
    expect(organization.address?.[0]?.line?.[0]).toBe("Jl. Kebon Jeruk No. 1");
  });

  test("searches organization by partof", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (input) => {
        const url = String(input);
        expect(url).toContain("partof=10000004");

        return new Response(
          JSON.stringify({
            resourceType: "Bundle",
            total: 1,
            entry: [
              {
                resource: {
                  resourceType: "Organization",
                  id: "child-org-1",
                  active: true,
                  identifier: [
                    {
                      system: "http://sys-ids.kemkes.go.id/organization/child-org-1",
                      value: "child-org-1",
                    },
                  ],
                  type: [
                    {
                      coding: [
                        {
                          system: "http://terminology.hl7.org/CodeSystem/organization-type",
                          code: "dept",
                        },
                      ],
                    },
                  ],
                  name: "Laboratorium Puskesmas SATUSEHAT",
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

    const result = await client.organization.search({
      partof: "10000004",
    });

    expect(result.total).toBe(1);
    expect(result.entry?.[0]?.resource.name).toBe("Laboratorium Puskesmas SATUSEHAT");
  });
});

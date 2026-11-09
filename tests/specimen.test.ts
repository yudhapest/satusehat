import { describe, test } from "node:test";

import { createSatuSehatClient, SatuSehatValidationError } from "../src";
import { expect } from "./helpers/expect";

const specimenPayload = {
  resourceType: "Specimen" as const,
  identifier: [
    {
      system: "http://sys-ids.kemkes.go.id/specimen/10000004",
      use: "official",
      value: "SP-0001",
    },
  ],
  accessionIdentifier: {
    system: "http://lab.example.org/accession",
    value: "ACC-20240401-0001",
  },
  status: "available" as const,
  type: {
    coding: [
      {
        system: "http://snomed.info/sct",
        code: "119364003",
        display: "Serum specimen",
      },
    ],
  },
  subject: {
    reference: "Patient/100000030009",
    display: "Budi Santoso",
  },
  receivedTime: "2024-04-01T03:15:00+00:00",
  request: [
    {
      reference: "ServiceRequest/6694e8c8-052a-4ea6-8072-157b6d47ca08",
    },
  ],
  collection: {
    collector: {
      reference: "Practitioner/N10000001",
      display: "Dokter Bronsig",
    },
    collectedDateTime: "2024-04-01T03:00:00+00:00",
    bodySite: {
      coding: [
        {
          system: "http://snomed.info/sct",
          code: "49852007",
          display: "Venous blood specimen",
        },
      ],
    },
  },
  container: [
    {
      description: "Vacutainer merah",
      specimenQuantity: {
        value: 3,
        unit: "mL",
        system: "http://unitsofmeasure.org",
        code: "mL",
      },
    },
  ],
  note: [
    {
      text: "Sampel diterima dalam kondisi baik.",
    },
  ],
};

describe("specimen endpoint", () => {
  test("validates supported search modes", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(JSON.stringify({ resourceType: "Bundle", entry: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });

    await expect(client.specimen.search({} as never)).rejects.toBeInstanceOf(
      SatuSehatValidationError,
    );
    await expect(
      client.specimen.search({
        collector: "N10000001",
      }),
    ).rejects.toBeInstanceOf(SatuSehatValidationError);
    await expect(
      client.specimen.search({
        subject: "100000030009",
        collector: "N10000001",
        collected: "2024-04-01",
      }),
    ).rejects.toBeInstanceOf(SatuSehatValidationError);
  });

  test("searches specimen by subject and collector", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (input) => {
        const url = String(input);
        expect(url).toContain("subject=100000030009");
        expect(url).toContain("collector=N10000001");

        return new Response(
          JSON.stringify({
            resourceType: "Bundle",
            total: 1,
            entry: [
              {
                resource: {
                  id: "5edd0663-093f-40f9-bf04-0c103fd6ec32",
                  ...specimenPayload,
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

    const result = await client.specimen.search({
      subject: "100000030009",
      collector: "N10000001",
    });

    expect(result.total).toBe(1);
    expect(result.entry?.[0]?.resource.id).toBe("5edd0663-093f-40f9-bf04-0c103fd6ec32");
    expect(result.entry?.[0]?.resource.status).toBe("available");
  });

  test("posts a validated specimen resource", async () => {
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        const requestBody = init?.body ? JSON.parse(String(init.body)) : undefined;
        capturedBody = requestBody;

        return new Response(
          JSON.stringify({
            id: "5edd0663-093f-40f9-bf04-0c103fd6ec32",
            ...(requestBody && typeof requestBody === "object" ? requestBody : {}),
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const specimen = await client.specimen.create(specimenPayload);

    expect((capturedBody as { resourceType: string }).resourceType).toBe("Specimen");
    expect(specimen.id).toBe("5edd0663-093f-40f9-bf04-0c103fd6ec32");
    expect(specimen.type.coding[0]?.code).toBe("119364003");
  });

  test("patches specimen with replace operations", async () => {
    let capturedMethod: string | undefined;
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        capturedMethod = init?.method;
        capturedBody = init?.body ? JSON.parse(String(init.body)) : undefined;

        return new Response(
          JSON.stringify({
            id: "5edd0663-093f-40f9-bf04-0c103fd6ec32",
            ...specimenPayload,
            status: "unavailable",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const updated = await client.specimen.patch({
      id: "5edd0663-093f-40f9-bf04-0c103fd6ec32",
      body: [
        {
          op: "replace",
          path: "/status",
          value: "unavailable",
        },
      ],
    });

    expect(capturedMethod).toBe("PATCH");
    expect(capturedBody).toEqual([
      {
        op: "replace",
        path: "/status",
        value: "unavailable",
      },
    ]);
    expect(updated.status).toBe("unavailable");
  });
});

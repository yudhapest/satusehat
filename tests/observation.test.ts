import { describe, test } from "node:test";

import { createSatuSehatClient, SatuSehatValidationError } from "../src";
import { expect } from "./helpers/expect";

const observationPayload = {
  resourceType: "Observation" as const,
  identifier: [
    {
      system: "http://sys-ids.kemkes.go.id/observation/10000004",
      use: "official",
      value: "R100005",
    },
  ],
  basedOn: [
    {
      reference: "ServiceRequest/6694e8c8-052a-4ea6-8072-157b6d47ca08",
    },
  ],
  status: "final" as const,
  category: [
    {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/observation-category",
          code: "vital-signs",
          display: "Vital Signs",
        },
      ],
    },
  ],
  code: {
    coding: [
      {
        system: "http://loinc.org",
        code: "8867-4",
        display: "Heart rate",
      },
    ],
  },
  subject: {
    reference: "Patient/100000030009",
    display: "Budi Santoso",
  },
  encounter: {
    reference: "Encounter/4f735a03-128b-464d-bf91-e6eacdf1c38f",
  },
  effectiveDateTime: "2024-04-01T01:30:00+00:00",
  issued: "2024-04-01T01:35:00+00:00",
  performer: [
    {
      reference: "Practitioner/N10000001",
      display: "Dokter Bronsig",
    },
  ],
  valueQuantity: {
    value: 80,
    unit: "beats/minute",
    system: "http://unitsofmeasure.org",
    code: "/min",
  },
  interpretation: [
    {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
          code: "N",
          display: "Normal",
        },
      ],
    },
  ],
  note: [
    {
      text: "Observasi nadi dalam batas normal.",
    },
  ],
  referenceRange: [
    {
      low: {
        value: 60,
        unit: "beats/minute",
        system: "http://unitsofmeasure.org",
        code: "/min",
      },
      high: {
        value: 100,
        unit: "beats/minute",
        system: "http://unitsofmeasure.org",
        code: "/min",
      },
      text: "Rentang normal dewasa",
    },
  ],
};

describe("observation endpoint", () => {
  test("validates that search requires supported parameters", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(JSON.stringify({ resourceType: "Bundle", entry: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });

    await expect(client.observation.search({} as never)).rejects.toBeInstanceOf(
      SatuSehatValidationError,
    );
    await expect(
      client.observation.search({
        "based-on": "6694e8c8-052a-4ea6-8072-157b6d47ca08",
      }),
    ).rejects.toBeInstanceOf(SatuSehatValidationError);
  });

  test('searches observation by subject and "based-on"', async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (input) => {
        const url = String(input);
        expect(url).toContain("subject=100000030009");
        expect(url).toContain("based-on=6694e8c8-052a-4ea6-8072-157b6d47ca08");

        return new Response(
          JSON.stringify({
            resourceType: "Bundle",
            total: 1,
            entry: [
              {
                resource: {
                  id: "af8ac2e3-0e72-45d7-ab8a-332f52fccbcd",
                  ...observationPayload,
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

    const result = await client.observation.search({
      subject: "100000030009",
      "based-on": "6694e8c8-052a-4ea6-8072-157b6d47ca08",
    });

    expect(result.total).toBe(1);
    expect(result.entry?.[0]?.resource.id).toBe("af8ac2e3-0e72-45d7-ab8a-332f52fccbcd");
    expect(result.entry?.[0]?.resource.valueQuantity?.value).toBe(80);
  });

  test("posts a validated observation resource", async () => {
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        const requestBody = init?.body ? JSON.parse(String(init.body)) : undefined;
        capturedBody = requestBody;

        return new Response(
          JSON.stringify({
            id: "af8ac2e3-0e72-45d7-ab8a-332f52fccbcd",
            ...(requestBody && typeof requestBody === "object" ? requestBody : {}),
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const observation = await client.observation.create(observationPayload);

    expect((capturedBody as { resourceType: string }).resourceType).toBe("Observation");
    expect(observation.id).toBe("af8ac2e3-0e72-45d7-ab8a-332f52fccbcd");
    expect(observation.code.coding[0]?.code).toBe("8867-4");
  });

  test("patches observation with replace operations", async () => {
    let capturedMethod: string | undefined;
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        capturedMethod = init?.method;
        capturedBody = init?.body ? JSON.parse(String(init.body)) : undefined;

        return new Response(
          JSON.stringify({
            id: "af8ac2e3-0e72-45d7-ab8a-332f52fccbcd",
            ...observationPayload,
            issued: "2024-04-01T02:00:00+00:00",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const updated = await client.observation.patch({
      id: "af8ac2e3-0e72-45d7-ab8a-332f52fccbcd",
      body: [
        {
          op: "replace",
          path: "/issued",
          value: "2024-04-01T02:00:00+00:00",
        },
      ],
    });

    expect(capturedMethod).toBe("PATCH");
    expect(capturedBody).toEqual([
      {
        op: "replace",
        path: "/issued",
        value: "2024-04-01T02:00:00+00:00",
      },
    ]);
    expect(updated.issued).toBe("2024-04-01T02:00:00+00:00");
  });
});

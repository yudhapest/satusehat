import { describe, test } from "node:test";

import { createSatuSehatClient, SatuSehatValidationError } from "../src";
import type { AllergyIntoleranceCreateInput } from "../src";
import { expect } from "./helpers/expect";

const allergyIntolerancePayload: AllergyIntoleranceCreateInput = {
  resourceType: "AllergyIntolerance" as const,
  identifier: [
    {
      system: "http://sys-ids.kemkes.go.id/allergy-intolerance/10000004",
      use: "official",
      value: "ALG-0001",
    },
  ],
  clinicalStatus: {
    coding: [
      {
        system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
        code: "active",
        display: "Active",
      },
    ],
  },
  verificationStatus: {
    coding: [
      {
        system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification",
        code: "confirmed",
        display: "Confirmed",
      },
    ],
  },
  type: "allergy" as const,
  category: ["medication"],
  criticality: "high" as const,
  code: {
    coding: [
      {
        system: "http://snomed.info/sct",
        code: "294513009",
        display: "Penicillin allergy",
      },
    ],
    text: "Alergi penisilin",
  },
  patient: {
    reference: "Patient/100000030009",
    display: "Budi Santoso",
  },
  encounter: {
    reference: "Encounter/2b2d0a3e-082a-4fe9-ae13-da9c3b5e422f",
  },
  recordedDate: "2024-04-01T01:20:00+00:00",
  recorder: {
    reference: "Practitioner/N10000001",
    display: "Dokter Bronsig",
  },
  note: [
    {
      text: "Pasien mengalami ruam setelah pemberian penisilin.",
    },
  ],
  reaction: [
    {
      manifestation: [
        {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "271807003",
              display: "Skin rash",
            },
          ],
        },
      ],
      severity: "moderate" as const,
      description: "Ruam merah di kulit",
    },
  ],
};

describe("allergyIntolerance endpoint", () => {
  test("validates that search requires patient", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(JSON.stringify({ resourceType: "Bundle", entry: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });

    await expect(client.allergyIntolerance.search({} as never)).rejects.toBeInstanceOf(
      SatuSehatValidationError,
    );
  });

  test("searches allergy intolerance by patient and code", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (input) => {
        const url = String(input);
        expect(url).toContain("patient=100000030009");
        expect(url).toContain("code=294513009");

        return new Response(
          JSON.stringify({
            resourceType: "Bundle",
            total: 1,
            entry: [
              {
                resource: {
                  id: "6c1202d7-660a-473b-b1c9-f536c0c40283",
                  ...allergyIntolerancePayload,
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

    const result = await client.allergyIntolerance.search({
      patient: "100000030009",
      code: "294513009",
    });

    expect(result.total).toBe(1);
    expect(result.entry?.[0]?.resource.id).toBe("6c1202d7-660a-473b-b1c9-f536c0c40283");
    expect(result.entry?.[0]?.resource.code.coding[0]?.code).toBe("294513009");
  });

  test("posts a validated allergy intolerance resource", async () => {
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        const requestBody = init?.body ? JSON.parse(String(init.body)) : undefined;
        capturedBody = requestBody;

        return new Response(
          JSON.stringify({
            id: "6c1202d7-660a-473b-b1c9-f536c0c40283",
            ...(requestBody && typeof requestBody === "object" ? requestBody : {}),
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const allergyIntolerance = await client.allergyIntolerance.create(allergyIntolerancePayload);

    expect((capturedBody as { resourceType: string }).resourceType).toBe("AllergyIntolerance");
    expect(allergyIntolerance.id).toBe("6c1202d7-660a-473b-b1c9-f536c0c40283");
    expect(allergyIntolerance.patient.reference).toBe("Patient/100000030009");
  });

  test("patches allergy intolerance with replace operations", async () => {
    let capturedMethod: string | undefined;
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        capturedMethod = init?.method;
        capturedBody = init?.body ? JSON.parse(String(init.body)) : undefined;

        return new Response(
          JSON.stringify({
            id: "6c1202d7-660a-473b-b1c9-f536c0c40283",
            ...allergyIntolerancePayload,
            criticality: "low",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const updated = await client.allergyIntolerance.patch({
      id: "6c1202d7-660a-473b-b1c9-f536c0c40283",
      body: [
        {
          op: "replace",
          path: "/criticality",
          value: "low",
        },
      ],
    });

    expect(capturedMethod).toBe("PATCH");
    expect(capturedBody).toEqual([
      {
        op: "replace",
        path: "/criticality",
        value: "low",
      },
    ]);
    expect(updated.criticality).toBe("low");
  });
});

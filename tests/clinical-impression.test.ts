import { describe, test } from "node:test";

import { createSatuSehatClient, SatuSehatValidationError } from "../src";
import type { ClinicalImpressionCreateInput } from "../src";
import { expect } from "./helpers/expect";

const clinicalImpressionPayload: ClinicalImpressionCreateInput = {
  resourceType: "ClinicalImpression",
  status: "completed",
  description: "Evaluasi awal pasien dengan keluhan nyeri dada.",
  subject: {
    reference: "Patient/100000030009",
    display: "Budi Santoso",
  },
  encounter: {
    reference: "Encounter/4f735a03-128b-464d-bf91-e6eacdf1c38f",
  },
  effectiveDateTime: "2024-04-01T01:15:00+00:00",
  date: "2024-04-01T01:20:00+00:00",
  assessor: {
    reference: "Practitioner/N10000001",
    display: "Dokter Bronsig",
  },
  summary: "Kemungkinan angina stabil, perlu pemeriksaan lanjutan.",
  finding: [
    {
      itemCodeableConcept: {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: "29857009",
            display: "Chest pain",
          },
        ],
      },
      basis: "Keluhan nyeri dada sejak 2 hari terakhir.",
    },
  ],
  note: [
    {
      text: "Pasien tampak stabil dan sadar penuh.",
    },
  ],
};

describe("clinicalImpression endpoint", () => {
  test("validates that search requires subject or encounter", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(JSON.stringify({ resourceType: "Bundle", entry: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });

    await expect(client.clinicalImpression.search({} as never)).rejects.toBeInstanceOf(
      SatuSehatValidationError,
    );
  });

  test("searches clinical impression by subject and encounter", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (input) => {
        const url = String(input);
        expect(url).toContain("subject=100000030009");
        expect(url).toContain("encounter=4f735a03-128b-464d-bf91-e6eacdf1c38f");

        return new Response(
          JSON.stringify({
            resourceType: "Bundle",
            total: 1,
            entry: [
              {
                resource: {
                  id: "a139a557-9404-4d45-bccc-979def0c928f",
                  ...clinicalImpressionPayload,
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

    const result = await client.clinicalImpression.search({
      subject: "100000030009",
      encounter: "4f735a03-128b-464d-bf91-e6eacdf1c38f",
    });

    expect(result.total).toBe(1);
    expect(result.entry?.[0]?.resource.id).toBe("a139a557-9404-4d45-bccc-979def0c928f");
    expect(result.entry?.[0]?.resource.status).toBe("completed");
  });

  test("posts a validated clinical impression resource", async () => {
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        const requestBody = init?.body ? JSON.parse(String(init.body)) : undefined;
        capturedBody = requestBody;

        return new Response(
          JSON.stringify({
            id: "a139a557-9404-4d45-bccc-979def0c928f",
            ...(requestBody && typeof requestBody === "object" ? requestBody : {}),
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const clinicalImpression = await client.clinicalImpression.create(clinicalImpressionPayload);

    expect((capturedBody as { resourceType: string }).resourceType).toBe("ClinicalImpression");
    expect(clinicalImpression.id).toBe("a139a557-9404-4d45-bccc-979def0c928f");
    expect(clinicalImpression.subject.reference).toBe("Patient/100000030009");
  });

  test("patches clinical impression with replace operations", async () => {
    let capturedMethod: string | undefined;
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        capturedMethod = init?.method;
        capturedBody = init?.body ? JSON.parse(String(init.body)) : undefined;

        return new Response(
          JSON.stringify({
            id: "a139a557-9404-4d45-bccc-979def0c928f",
            ...clinicalImpressionPayload,
            summary: "Observasi mengarah ke angina stabil, evaluasi EKG disarankan.",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const updated = await client.clinicalImpression.patch({
      id: "a139a557-9404-4d45-bccc-979def0c928f",
      body: [
        {
          op: "replace",
          path: "/summary",
          value: "Observasi mengarah ke angina stabil, evaluasi EKG disarankan.",
        },
      ],
    });

    expect(capturedMethod).toBe("PATCH");
    expect(capturedBody).toEqual([
      {
        op: "replace",
        path: "/summary",
        value: "Observasi mengarah ke angina stabil, evaluasi EKG disarankan.",
      },
    ]);
    expect(updated.summary).toBe("Observasi mengarah ke angina stabil, evaluasi EKG disarankan.");
  });
});

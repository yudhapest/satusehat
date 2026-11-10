import { describe, test } from "node:test";

import { createSatuSehatClient, SatuSehatValidationError } from "../src";
import type { RiskAssessmentCreateInput } from "../src";
import { expect } from "./helpers/expect";

const riskAssessmentPayload: RiskAssessmentCreateInput = {
  resourceType: "RiskAssessment",
  status: "final",
  code: {
    coding: [
      {
        system: "http://snomed.info/sct",
        code: "225358003",
        display: "Risk for coronary heart disease",
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
  occurrenceDateTime: "2024-04-01T01:30:00+00:00",
  condition: {
    reference: "Condition/2a4e1a13-ee52-4c8b-a2ef-f41c79de698d",
  },
  performer: {
    reference: "Practitioner/N10000001",
    display: "Dokter Bronsig",
  },
  basis: [
    {
      reference: "Observation/af8ac2e3-0e72-45d7-ab8a-332f52fccbcd",
    },
  ],
  prediction: [
    {
      outcome: {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: "22298006",
            display: "Myocardial infarction",
          },
        ],
      },
      probabilityDecimal: 0.32,
      qualitativeRisk: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/risk-probability",
            code: "moderate",
            display: "Moderate",
          },
        ],
      },
      rationale: "Faktor risiko meningkat berdasarkan profil lipid dan riwayat keluarga.",
    },
  ],
  mitigation: "Anjurkan modifikasi gaya hidup dan follow-up kardiologi.",
  note: [
    {
      text: "Skoring risiko digunakan untuk evaluasi awal rawat jalan.",
    },
  ],
};

describe("riskAssessment endpoint", () => {
  test("validates that search requires subject or encounter", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(JSON.stringify({ resourceType: "Bundle", entry: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });

    await expect(client.riskAssessment.search({} as never)).rejects.toBeInstanceOf(
      SatuSehatValidationError,
    );
  });

  test("searches risk assessment by subject and encounter", async () => {
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
                  id: "b523ec9d-9df6-4d20-911d-703f74d5ec0a",
                  ...riskAssessmentPayload,
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

    const result = await client.riskAssessment.search({
      subject: "100000030009",
      encounter: "4f735a03-128b-464d-bf91-e6eacdf1c38f",
    });

    expect(result.total).toBe(1);
    expect(result.entry?.[0]?.resource.id).toBe("b523ec9d-9df6-4d20-911d-703f74d5ec0a");
    expect(result.entry?.[0]?.resource.prediction?.[0]?.probabilityDecimal).toBe(0.32);
  });

  test("posts a validated risk assessment resource", async () => {
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        const requestBody = init?.body ? JSON.parse(String(init.body)) : undefined;
        capturedBody = requestBody;

        return new Response(
          JSON.stringify({
            id: "b523ec9d-9df6-4d20-911d-703f74d5ec0a",
            ...(requestBody && typeof requestBody === "object" ? requestBody : {}),
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const riskAssessment = await client.riskAssessment.create(riskAssessmentPayload);

    expect((capturedBody as { resourceType: string }).resourceType).toBe("RiskAssessment");
    expect(riskAssessment.id).toBe("b523ec9d-9df6-4d20-911d-703f74d5ec0a");
    expect(riskAssessment.subject.reference).toBe("Patient/100000030009");
  });

  test("patches risk assessment with replace operations", async () => {
    let capturedMethod: string | undefined;
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        capturedMethod = init?.method;
        capturedBody = init?.body ? JSON.parse(String(init.body)) : undefined;

        return new Response(
          JSON.stringify({
            id: "b523ec9d-9df6-4d20-911d-703f74d5ec0a",
            ...riskAssessmentPayload,
            mitigation: "Tambahkan terapi statin dan evaluasi ulang dalam 1 bulan.",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const updated = await client.riskAssessment.patch({
      id: "b523ec9d-9df6-4d20-911d-703f74d5ec0a",
      body: [
        {
          op: "replace",
          path: "/mitigation",
          value: "Tambahkan terapi statin dan evaluasi ulang dalam 1 bulan.",
        },
      ],
    });

    expect(capturedMethod).toBe("PATCH");
    expect(capturedBody).toEqual([
      {
        op: "replace",
        path: "/mitigation",
        value: "Tambahkan terapi statin dan evaluasi ulang dalam 1 bulan.",
      },
    ]);
    expect(updated.mitigation).toBe("Tambahkan terapi statin dan evaluasi ulang dalam 1 bulan.");
  });
});

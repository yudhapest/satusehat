import { describe, test } from "node:test";

import { createSatuSehatClient, SatuSehatValidationError } from "../src";
import type { NutritionOrderCreateInput } from "../src";
import { expect } from "./helpers/expect";

const nutritionOrderPayload: NutritionOrderCreateInput = {
  resourceType: "NutritionOrder",
  identifier: [
    {
      system: "http://sys-ids.kemkes.go.id/nutrition/10000004",
      use: "official",
      value: "NUTRI-0001",
    },
  ],
  status: "active",
  intent: "order",
  priority: "routine",
  patient: {
    reference: "Patient/100000030009",
    display: "Budi Santoso",
  },
  encounter: {
    reference: "Encounter/6694e8c8-052a-4ea6-8072-157b6d47ca08",
  },
  dateTime: "2024-04-01T03:15:00+00:00",
  orderer: {
    reference: "Practitioner/N10000001",
    display: "Ahli Gizi Satu Sehat",
  },
  oralDiet: {
    type: [
      {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: "226211001",
            display: "Low salt diet",
          },
        ],
      },
    ],
    instruction: "Diet rendah garam 1700 kkal per hari.",
  },
  supplement: [
    {
      productName: "Suplemen tinggi protein",
      quantity: {
        value: 2,
        unit: "BOTOL",
      },
      instruction: "Diberikan pagi dan malam hari.",
    },
  ],
  enteralFormula: {
    baseFormulaProductName: "Formula enteral standar",
    caloricDensity: {
      value: 1,
      unit: "kkal/mL",
    },
    administration: [
      {
        quantity: {
          value: 200,
          unit: "mL",
          system: "http://unitsofmeasure.org",
          code: "mL",
        },
      },
    ],
  },
  note: [
    {
      text: "Pantau toleransi pasien terhadap diet enteral.",
    },
  ],
};

describe("nutritionOrder endpoint", () => {
  test("validates that search requires patient, subject, or encounter", () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(JSON.stringify({ resourceType: "Bundle", entry: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });

    expect(() => client.nutritionOrder.search({} as never)).toThrow(SatuSehatValidationError);
  });

  test("searches nutrition order and normalizes subject alias to patient", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (input) => {
        const url = String(input);
        expect(url).toContain("patient=100000030009");
        expect(url).toContain("encounter=6694e8c8-052a-4ea6-8072-157b6d47ca08");
        expect(url).not.toContain("subject=");

        return new Response(
          JSON.stringify({
            resourceType: "Bundle",
            total: 1,
            entry: [
              {
                resource: {
                  id: "a0b4b86c-9a48-4711-8238-69e4dcde50df",
                  ...nutritionOrderPayload,
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

    const result = await client.nutritionOrder.search({
      subject: "100000030009",
      encounter: "6694e8c8-052a-4ea6-8072-157b6d47ca08",
    });

    expect(result.total).toBe(1);
    expect(result.entry?.[0]?.resource.id).toBe("a0b4b86c-9a48-4711-8238-69e4dcde50df");
    expect(result.entry?.[0]?.resource.intent).toBe("order");
  });

  test("posts a validated nutrition order resource", async () => {
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        const requestBody = init?.body ? JSON.parse(String(init.body)) : undefined;
        capturedBody = requestBody;

        return new Response(
          JSON.stringify({
            id: "a0b4b86c-9a48-4711-8238-69e4dcde50df",
            ...(requestBody && typeof requestBody === "object" ? requestBody : {}),
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const nutritionOrder = await client.nutritionOrder.create(nutritionOrderPayload);

    expect((capturedBody as { resourceType: string }).resourceType).toBe("NutritionOrder");
    expect(nutritionOrder.id).toBe("a0b4b86c-9a48-4711-8238-69e4dcde50df");
    expect(nutritionOrder.patient?.reference).toBe("Patient/100000030009");
  });

  test("patches nutrition order with replace operations", async () => {
    let capturedMethod: string | undefined;
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        capturedMethod = init?.method;
        capturedBody = init?.body ? JSON.parse(String(init.body)) : undefined;

        return new Response(
          JSON.stringify({
            id: "a0b4b86c-9a48-4711-8238-69e4dcde50df",
            ...nutritionOrderPayload,
            status: "completed",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const updated = await client.nutritionOrder.patch({
      id: "a0b4b86c-9a48-4711-8238-69e4dcde50df",
      body: [
        {
          op: "replace",
          path: "/status",
          value: "completed",
        },
      ],
    });

    expect(capturedMethod).toBe("PATCH");
    expect(capturedBody).toEqual([
      {
        op: "replace",
        path: "/status",
        value: "completed",
      },
    ]);
    expect(updated.status).toBe("completed");
  });
});

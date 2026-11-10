import { describe, test } from "node:test";

import { createSatuSehatClient, SatuSehatValidationError } from "../src";
import { expect } from "./helpers/expect";

const medicationDispensePayload = {
  resourceType: "MedicationDispense" as const,
  identifier: [
    {
      system: "http://sys-ids.kemkes.go.id/prescription/10000004",
      use: "official",
      value: "RX-0001",
    },
    {
      system: "http://sys-ids.kemkes.go.id/prescription-item/10000004",
      use: "official",
      value: "RX-ITEM-0001",
    },
  ],
  status: "completed" as const,
  medicationReference: {
    reference: "Medication/8f299a19-5887-4b8e-90a2-c2c15ecbe1d1",
    display: "Paracetamol 500 mg tablet",
  },
  subject: {
    reference: "Patient/100000030009",
    display: "Budi Santoso",
  },
  context: {
    reference: "Encounter/4f735a03-128b-464d-bf91-e6eacdf1c38f",
  },
  performer: [
    {
      actor: {
        reference: "Practitioner/N10000001",
        display: "Apoteker Satu Sehat",
      },
    },
  ],
  authorizingPrescription: [
    {
      reference: "MedicationRequest/cf92db3e-a044-4e15-83fb-b7ec3a30ba76",
    },
  ],
  quantity: {
    value: 30,
    unit: "TAB",
    system: "http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm",
    code: "TAB",
  },
  whenHandedOver: "2024-04-01T02:30:00+00:00",
};

describe("medicationDispense endpoint", () => {
  test("validates that search requires subject, context, or prescription", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(JSON.stringify({ resourceType: "Bundle", entry: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });

    await expect(client.medicationDispense.search({} as never)).rejects.toBeInstanceOf(
      SatuSehatValidationError,
    );
  });

  test("validates that context search also requires subject", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(JSON.stringify({ resourceType: "Bundle", entry: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });

    await expect(
      client.medicationDispense.search({
        context: "4f735a03-128b-464d-bf91-e6eacdf1c38f",
      }),
    ).rejects.toBeInstanceOf(SatuSehatValidationError);
  });

  test("searches medication dispense by subject and context", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (input) => {
        const url = String(input);
        expect(url).toContain("subject=100000030009");
        expect(url).toContain("context=4f735a03-128b-464d-bf91-e6eacdf1c38f");

        return new Response(
          JSON.stringify({
            resourceType: "Bundle",
            total: 1,
            entry: [
              {
                resource: {
                  id: "a105b589-d571-4be6-bb0e-98b4be891e14",
                  ...medicationDispensePayload,
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

    const result = await client.medicationDispense.search({
      subject: "100000030009",
      context: "4f735a03-128b-464d-bf91-e6eacdf1c38f",
    });

    expect(result.total).toBe(1);
    expect(result.entry?.[0]?.resource.id).toBe("a105b589-d571-4be6-bb0e-98b4be891e14");
    expect(result.entry?.[0]?.resource.status).toBe("completed");
  });

  test("posts a validated medication dispense resource", async () => {
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        const requestBody = init?.body ? JSON.parse(String(init.body)) : undefined;
        capturedBody = requestBody;

        return new Response(
          JSON.stringify({
            id: "a105b589-d571-4be6-bb0e-98b4be891e14",
            ...(requestBody && typeof requestBody === "object" ? requestBody : {}),
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const medicationDispense = await client.medicationDispense.create(
      medicationDispensePayload,
    );

    expect((capturedBody as { resourceType: string }).resourceType).toBe(
      "MedicationDispense",
    );
    expect(medicationDispense.id).toBe("a105b589-d571-4be6-bb0e-98b4be891e14");
    expect(medicationDispense.authorizingPrescription?.[0]?.reference).toBe(
      "MedicationRequest/cf92db3e-a044-4e15-83fb-b7ec3a30ba76",
    );
  });

  test("patches medication dispense with replace operations", async () => {
    let capturedMethod: string | undefined;
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        capturedMethod = init?.method;
        capturedBody = init?.body ? JSON.parse(String(init.body)) : undefined;

        return new Response(
          JSON.stringify({
            id: "a105b589-d571-4be6-bb0e-98b4be891e14",
            ...medicationDispensePayload,
            status: "cancelled",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const updated = await client.medicationDispense.patch({
      id: "a105b589-d571-4be6-bb0e-98b4be891e14",
      body: [
        {
          op: "replace",
          path: "/status",
          value: "cancelled",
        },
      ],
    });

    expect(capturedMethod).toBe("PATCH");
    expect(capturedBody).toEqual([
      {
        op: "replace",
        path: "/status",
        value: "cancelled",
      },
    ]);
    expect(updated.status).toBe("cancelled");
  });
});

import { describe, test } from "node:test";

import { createSatuSehatClient, SatuSehatValidationError } from "../src";
import { expect } from "./helpers/expect";

const medicationAdministrationPayload = {
  resourceType: "MedicationAdministration" as const,
  identifier: [
    {
      use: "official",
      value: "MEDADMIN-001",
    },
  ],
  status: "completed" as const,
  category: {
    coding: [
      {
        system: "http://terminology.hl7.org/CodeSystem/medication-admin-category",
        code: "inpatient",
        display: "Inpatient",
      },
    ],
  },
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
  effectiveDateTime: "2024-04-01T02:30:00+00:00",
  performer: [
    {
      actor: {
        reference: "Practitioner/N10000001",
        display: "Perawat Satu Sehat",
      },
    },
  ],
  request: {
    reference: "MedicationRequest/cf92db3e-a044-4e15-83fb-b7ec3a30ba76",
  },
  dosage: {
    text: "Berikan 1 tablet sesudah makan.",
    route: {
      coding: [
        {
          system: "http://www.whocc.no/atc",
          code: "O",
          display: "Oral use",
        },
      ],
    },
    dose: {
      value: 1,
      unit: "TAB",
      system: "http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm",
      code: "TAB",
    },
  },
  note: [
    {
      text: "Obat diberikan oleh perawat jaga malam.",
    },
  ],
};

describe("medicationAdministration endpoint", () => {
  test("validates that search requires subject or context", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(JSON.stringify({ resourceType: "Bundle", entry: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });

    await expect(client.medicationAdministration.search({} as never)).rejects.toBeInstanceOf(
      SatuSehatValidationError,
    );
  });

  test("searches medication administration by subject and context", async () => {
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
                  id: "86da7eb8-b3af-4f78-bdd2-3a546df992e1",
                  ...medicationAdministrationPayload,
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

    const result = await client.medicationAdministration.search({
      subject: "100000030009",
      context: "4f735a03-128b-464d-bf91-e6eacdf1c38f",
    });

    expect(result.total).toBe(1);
    expect(result.entry?.[0]?.resource.id).toBe("86da7eb8-b3af-4f78-bdd2-3a546df992e1");
    expect(result.entry?.[0]?.resource.status).toBe("completed");
  });

  test("posts a validated medication administration resource", async () => {
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        const requestBody = init?.body ? JSON.parse(String(init.body)) : undefined;
        capturedBody = requestBody;

        return new Response(
          JSON.stringify({
            id: "86da7eb8-b3af-4f78-bdd2-3a546df992e1",
            ...(requestBody && typeof requestBody === "object" ? requestBody : {}),
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const medicationAdministration = await client.medicationAdministration.create(
      medicationAdministrationPayload,
    );

    expect((capturedBody as { resourceType: string }).resourceType).toBe(
      "MedicationAdministration",
    );
    expect(medicationAdministration.id).toBe("86da7eb8-b3af-4f78-bdd2-3a546df992e1");
    expect(medicationAdministration.request?.reference).toBe(
      "MedicationRequest/cf92db3e-a044-4e15-83fb-b7ec3a30ba76",
    );
  });

  test("patches medication administration with replace operations", async () => {
    let capturedMethod: string | undefined;
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        capturedMethod = init?.method;
        capturedBody = init?.body ? JSON.parse(String(init.body)) : undefined;

        return new Response(
          JSON.stringify({
            id: "86da7eb8-b3af-4f78-bdd2-3a546df992e1",
            ...medicationAdministrationPayload,
            status: "stopped",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const updated = await client.medicationAdministration.patch({
      id: "86da7eb8-b3af-4f78-bdd2-3a546df992e1",
      body: [
        {
          op: "replace",
          path: "/status",
          value: "stopped",
        },
      ],
    });

    expect(capturedMethod).toBe("PATCH");
    expect(capturedBody).toEqual([
      {
        op: "replace",
        path: "/status",
        value: "stopped",
      },
    ]);
    expect(updated.status).toBe("stopped");
  });
});

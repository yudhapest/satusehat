import { describe, test } from "node:test";

import { createSatuSehatClient, SatuSehatValidationError } from "../src";
import { expect } from "./helpers/expect";

const medicationRequestPayload = {
  resourceType: "MedicationRequest" as const,
  identifier: [
    {
      system: "http://sys-ids.kemkes.go.id/prescription-item/10000004",
      use: "official",
      value: "RX-0001",
    },
  ],
  basedOn: [
    {
      reference: "ServiceRequest/6694e8c8-052a-4ea6-8072-157b6d47ca08",
    },
  ],
  status: "active" as const,
  intent: "order" as const,
  category: [
    {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/medicationrequest-category",
          code: "outpatient",
          display: "Outpatient",
        },
      ],
    },
  ],
  priority: "routine" as const,
  medicationReference: {
    reference: "Medication/8f299a19-5887-4b8e-90a2-c2c15ecbe1d1",
    display:
      "Obat Anti Tuberculosis / Rifampicin 150 mg / Isoniazid 75 mg / Pyrazinamide 400 mg / Ethambutol 275 mg",
  },
  subject: {
    reference: "Patient/100000030009",
    display: "Budi Santoso",
  },
  encounter: {
    reference: "Encounter/2823ed1d-3e3e-434e-9a5b-9c579d192787",
  },
  authoredOn: "2024-04-01T02:10:00+00:00",
  requester: {
    reference: "Practitioner/N10000001",
    display: "Dokter Bronsig",
  },
  reasonCode: [
    {
      coding: [
        {
          system: "http://hl7.org/fhir/sid/icd-10",
          code: "A15.0",
          display: "Tuberculosis of lung, confirmed by sputum microscopy with or without culture",
        },
      ],
    },
  ],
  note: [
    {
      text: "Diminum setelah makan.",
    },
  ],
  dosageInstruction: [
    {
      sequence: 1,
      text: "Minum 1 tablet 2 kali sehari sesudah makan",
      timing: {
        repeat: {
          frequency: 2,
          period: 1,
          periodUnit: "d",
        },
      },
      route: {
        coding: [
          {
            system: "http://www.whocc.no/atc",
            code: "O",
            display: "Oral use",
          },
        ],
      },
      doseAndRate: [
        {
          doseQuantity: {
            value: 1,
            unit: "TAB",
            system: "http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm",
            code: "TAB",
          },
        },
      ],
    },
  ],
  dispenseRequest: {
    quantity: {
      value: 30,
      unit: "TAB",
      system: "http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm",
      code: "TAB",
    },
    expectedSupplyDuration: {
      value: 15,
      unit: "days",
      system: "http://unitsofmeasure.org",
      code: "d",
    },
  },
  substitution: {
    allowedBoolean: false,
  },
};

describe("medicationRequest endpoint", () => {
  test("validates that search requires subject or encounter", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(JSON.stringify({ resourceType: "Bundle", entry: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });

    await expect(client.medicationRequest.search({} as never)).rejects.toBeInstanceOf(
      SatuSehatValidationError,
    );
  });

  test("searches medication request by subject and encounter", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (input) => {
        const url = String(input);
        expect(url).toContain("subject=100000030009");
        expect(url).toContain("encounter=2823ed1d-3e3e-434e-9a5b-9c579d192787");

        return new Response(
          JSON.stringify({
            resourceType: "Bundle",
            total: 1,
            entry: [
              {
                resource: {
                  id: "cf92db3e-a044-4e15-83fb-b7ec3a30ba76",
                  ...medicationRequestPayload,
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

    const result = await client.medicationRequest.search({
      subject: "100000030009",
      encounter: "2823ed1d-3e3e-434e-9a5b-9c579d192787",
    });

    expect(result.total).toBe(1);
    expect(result.entry?.[0]?.resource.id).toBe("cf92db3e-a044-4e15-83fb-b7ec3a30ba76");
    expect(result.entry?.[0]?.resource.intent).toBe("order");
  });

  test("posts a validated medication request resource", async () => {
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        const requestBody = init?.body ? JSON.parse(String(init.body)) : undefined;
        capturedBody = requestBody;

        return new Response(
          JSON.stringify({
            id: "cf92db3e-a044-4e15-83fb-b7ec3a30ba76",
            ...(requestBody && typeof requestBody === "object" ? requestBody : {}),
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const medicationRequest = await client.medicationRequest.create(medicationRequestPayload);

    expect((capturedBody as { resourceType: string }).resourceType).toBe("MedicationRequest");
    expect(medicationRequest.id).toBe("cf92db3e-a044-4e15-83fb-b7ec3a30ba76");
    expect(medicationRequest.medicationReference.reference).toBe(
      "Medication/8f299a19-5887-4b8e-90a2-c2c15ecbe1d1",
    );
  });

  test("accepts prescription identifiers with subsystem and prescription-item identifiers", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) =>
        new Response(
          JSON.stringify({
            id: "cf92db3e-a044-4e15-83fb-b7ec3a30ba76",
            ...(init?.body ? JSON.parse(String(init.body)) : {}),
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
    });

    await expect(
      client.medicationRequest.create({
        ...medicationRequestPayload,
        identifier: [
          {
            system: "http://sys-ids.kemkes.go.id/prescription/10000004/rme",
            use: "official",
            value: "RX-LEGACY-1",
          },
        ],
      }),
    ).resolves.toMatchObject({
      identifier: [
        {
          system: "http://sys-ids.kemkes.go.id/prescription/10000004/rme",
          value: "RX-LEGACY-1",
        },
      ],
    });

    await expect(
      client.medicationRequest.create(medicationRequestPayload),
    ).resolves.toMatchObject({
      identifier: [
        {
          system: "http://sys-ids.kemkes.go.id/prescription-item/10000004",
          value: "RX-0001",
        },
      ],
    });
  });

  test("patches medication request with replace operations", async () => {
    let capturedMethod: string | undefined;
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        capturedMethod = init?.method;
        capturedBody = init?.body ? JSON.parse(String(init.body)) : undefined;

        return new Response(
          JSON.stringify({
            id: "cf92db3e-a044-4e15-83fb-b7ec3a30ba76",
            ...medicationRequestPayload,
            status: "completed",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const updated = await client.medicationRequest.patch({
      id: "cf92db3e-a044-4e15-83fb-b7ec3a30ba76",
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

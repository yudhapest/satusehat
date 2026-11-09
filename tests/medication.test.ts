import { describe, test } from "node:test";

import { createSatuSehatClient } from "../src";
import { expect } from "./helpers/expect";

const medicationPayload = {
  resourceType: "Medication" as const,
  identifier: [
    {
      system: "http://sys-ids.kemkes.go.id/medication/10000004",
      use: "official",
      value: "MED-0001",
    },
  ],
  code: {
    coding: [
      {
        system: "http://sys-ids.kemkes.go.id/kfa",
        code: "93001002",
        display:
          "Obat Anti Tuberculosis / Rifampicin 150 mg / Isoniazid 75 mg / Pyrazinamide 400 mg / Ethambutol 275 mg Tablet",
      },
    ],
  },
  status: "active" as const,
  form: {
    coding: [
      {
        system: "http://terminology.kemkes.go.id/CodeSystem/medication-form",
        code: "BS066",
        display: "Tablet",
      },
    ],
  },
  amount: {
    numerator: {
      value: 1,
      unit: "TAB",
      system: "http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm",
      code: "TAB",
    },
    denominator: {
      value: 1,
      unit: "package",
      system: "http://unitsofmeasure.org",
      code: "{Package}",
    },
  },
  ingredient: [
    {
      itemCodeableConcept: {
        coding: [
          {
            system: "http://sys-ids.kemkes.go.id/kfa",
            code: "91000197",
            display: "Rifampicin",
          },
        ],
      },
      isActive: true,
    },
  ],
  batch: {
    lotNumber: "LOT-001",
    expirationDate: "2027-12-31",
  },
  extension: [
    {
      url: "https://fhir.kemkes.go.id/r4/StructureDefinition/MedicationType" as const,
      valueCodeableConcept: {
        coding: [
          {
            system: "http://terminology.kemkes.go.id/CodeSystem/medication-type",
            code: "NC",
            display: "Non-compound",
          },
        ],
      },
    },
  ],
};

describe("medication endpoint", () => {
  test("gets medication by id", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(
          JSON.stringify({
            id: "4a6d884b-8d4b-4e16-b192-6416502d0999",
            ...medicationPayload,
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
    });

    const medication = await client.medication.getById({
      id: "4a6d884b-8d4b-4e16-b192-6416502d0999",
    });

    expect(medication.id).toBe("4a6d884b-8d4b-4e16-b192-6416502d0999");
    expect(medication.extension[0]?.valueCodeableConcept.coding[0]?.code).toBe("NC");
  });

  test("posts a validated medication resource", async () => {
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        const requestBody = init?.body ? JSON.parse(String(init.body)) : undefined;
        capturedBody = requestBody;

        return new Response(
          JSON.stringify({
            id: "4a6d884b-8d4b-4e16-b192-6416502d0999",
            ...(requestBody && typeof requestBody === "object" ? requestBody : {}),
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const medication = await client.medication.create(medicationPayload);

    expect((capturedBody as { resourceType: string }).resourceType).toBe("Medication");
    expect(medication.id).toBe("4a6d884b-8d4b-4e16-b192-6416502d0999");
    expect(medication.code?.coding[0]?.code).toBe("93001002");
  });

  test("patches medication with replace operations", async () => {
    let capturedMethod: string | undefined;
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        capturedMethod = init?.method;
        capturedBody = init?.body ? JSON.parse(String(init.body)) : undefined;

        return new Response(
          JSON.stringify({
            id: "4a6d884b-8d4b-4e16-b192-6416502d0999",
            ...medicationPayload,
            status: "inactive",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const updated = await client.medication.patch({
      id: "4a6d884b-8d4b-4e16-b192-6416502d0999",
      body: [
        {
          op: "replace",
          path: "/status",
          value: "inactive",
        },
      ],
    });

    expect(capturedMethod).toBe("PATCH");
    expect(capturedBody).toEqual([
      {
        op: "replace",
        path: "/status",
        value: "inactive",
      },
    ]);
    expect(updated.status).toBe("inactive");
  });
});

import { describe, test } from "node:test";

import {
  createSatuSehatClient,
  SatuSehatValidationError,
  type MedicationStatementCreateInput,
} from "../src";
import { expect } from "./helpers/expect";

const medicationStatementPayload: MedicationStatementCreateInput = {
  resourceType: "MedicationStatement",
  status: "active",
  category: {
    coding: [
      {
        system: "http://terminology.hl7.org/CodeSystem/medication-statement-category",
        code: "community",
        display: "Community",
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
    reference: "Encounter/2823ed1d-3e3e-434e-9a5b-9c579d192787",
  },
  effectiveDateTime: "2024-04-01T02:10:00+00:00",
  dateAsserted: "2024-04-01T02:10:00+00:00",
  informationSource: {
    reference: "Practitioner/N10000001",
    display: "Dokter Bronsig",
  },
  note: [
    {
      text: "Pasien sedang menjalani terapi obat secara aktif.",
    },
  ],
  dosage: [
    {
      text: "Minum 1 tablet 3 kali sehari sesudah makan",
    },
  ],
};

describe("medicationStatement endpoint", () => {
  test("validates that search requires subject or context", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(JSON.stringify({ resourceType: "Bundle", entry: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });

    await expect(client.medicationStatement.search({} as never)).rejects.toBeInstanceOf(
      SatuSehatValidationError,
    );
  });

  test("searches medication statement by subject and context", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (input) => {
        const url = String(input);
        expect(url).toContain("subject=100000030009");
        expect(url).toContain("context=2823ed1d-3e3e-434e-9a5b-9c579d192787");

        return new Response(
          JSON.stringify({
            resourceType: "Bundle",
            total: 1,
            entry: [
              {
                resource: {
                  id: "e2e5f59f-818a-4e06-a1d1-c1f5e473e1a4",
                  ...medicationStatementPayload,
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

    const result = await client.medicationStatement.search({
      subject: "100000030009",
      context: "2823ed1d-3e3e-434e-9a5b-9c579d192787",
    });

    expect(result.total).toBe(1);
    expect(result.entry?.[0]?.resource.id).toBe("e2e5f59f-818a-4e06-a1d1-c1f5e473e1a4");
    expect(result.entry?.[0]?.resource.status).toBe("active");
  });

  test("posts a validated medication statement resource", async () => {
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        const requestBody = init?.body ? JSON.parse(String(init.body)) : undefined;
        capturedBody = requestBody;

        return new Response(
          JSON.stringify({
            id: "e2e5f59f-818a-4e06-a1d1-c1f5e473e1a4",
            ...(requestBody && typeof requestBody === "object" ? requestBody : {}),
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const medicationStatement = await client.medicationStatement.create(
      medicationStatementPayload,
    );

    expect((capturedBody as { resourceType: string }).resourceType).toBe(
      "MedicationStatement",
    );
    expect(medicationStatement.id).toBe("e2e5f59f-818a-4e06-a1d1-c1f5e473e1a4");
    expect(medicationStatement.informationSource?.reference).toBe(
      "Practitioner/N10000001",
    );
  });

  test("rejects payloads that send medicationReference and medicationCodeableConcept together", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(JSON.stringify({ id: "ignored" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });

    await expect(
      client.medicationStatement.create({
        ...medicationStatementPayload,
        medicationCodeableConcept: {
          coding: [
            {
              system: "http://sys-ids.kemkes.go.id/kfa",
              code: "91000189",
              display: "Paracetamol 500 mg tablet",
            },
          ],
        },
      }),
    ).rejects.toBeInstanceOf(SatuSehatValidationError);
  });

  test("patches medication statement with replace operations", async () => {
    let capturedMethod: string | undefined;
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        capturedMethod = init?.method;
        capturedBody = init?.body ? JSON.parse(String(init.body)) : undefined;

        return new Response(
          JSON.stringify({
            id: "e2e5f59f-818a-4e06-a1d1-c1f5e473e1a4",
            ...medicationStatementPayload,
            status: "completed",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const updated = await client.medicationStatement.patch({
      id: "e2e5f59f-818a-4e06-a1d1-c1f5e473e1a4",
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

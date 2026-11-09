import { describe, test } from "node:test";

import { createSatuSehatClient, SatuSehatValidationError } from "../src";
import { expect } from "./helpers/expect";

const procedurePayload = {
  resourceType: "Procedure" as const,
  identifier: [
    {
      system: "http://sys-ids.kemkes.go.id/procedure/10000004",
      use: "official",
      value: "PROC-001",
    },
  ],
  status: "completed" as const,
  category: {
    coding: [
      {
        system: "http://snomed.info/sct",
        code: "103693007",
        display: "Diagnostic procedure",
      },
    ],
  },
  code: {
    coding: [
      {
        system: "http://hl7.org/fhir/sid/icd-9-cm",
        code: "87.44",
        display: "Routine chest x-ray, so described",
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
  performedDateTime: "2024-04-01T02:00:00+00:00",
  performer: [
    {
      actor: {
        reference: "Practitioner/N10000001",
        display: "Dokter Bronsig",
      },
      onBehalfOf: {
        reference: "Organization/10000004",
        display: "RS SATUSEHAT",
      },
    },
  ],
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
  bodySite: [
    {
      coding: [
        {
          system: "http://snomed.info/sct",
          code: "302551006",
          display: "Entire Thorax",
        },
      ],
    },
  ],
  outcome: {
    coding: [
      {
        system: "http://snomed.info/sct",
        code: "385669000",
        display: "Successful",
      },
    ],
  },
  note: [
    {
      text: "Rontgen thorax melihat perluasan infiltrat dan kavitas.",
    },
  ],
};

describe("procedure endpoint", () => {
  test("validates that search requires subject or encounter", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(JSON.stringify({ resourceType: "Bundle", entry: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });

    await expect(client.procedure.search({} as never)).rejects.toBeInstanceOf(
      SatuSehatValidationError,
    );
  });

  test("searches procedure by subject and encounter", async () => {
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
                  id: "6c9cb16e-7775-4c80-b5b2-3d04901df1f3",
                  ...procedurePayload,
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

    const result = await client.procedure.search({
      subject: "100000030009",
      encounter: "4f735a03-128b-464d-bf91-e6eacdf1c38f",
    });

    expect(result.total).toBe(1);
    expect(result.entry?.[0]?.resource.id).toBe("6c9cb16e-7775-4c80-b5b2-3d04901df1f3");
    expect(result.entry?.[0]?.resource.code.coding[0]?.code).toBe("87.44");
  });

  test("posts a validated procedure resource", async () => {
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        const requestBody = init?.body ? JSON.parse(String(init.body)) : undefined;
        capturedBody = requestBody;

        return new Response(
          JSON.stringify({
            id: "6c9cb16e-7775-4c80-b5b2-3d04901df1f3",
            ...(requestBody && typeof requestBody === "object" ? requestBody : {}),
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const procedure = await client.procedure.create(procedurePayload);

    expect((capturedBody as { resourceType: string }).resourceType).toBe("Procedure");
    expect(procedure.id).toBe("6c9cb16e-7775-4c80-b5b2-3d04901df1f3");
    expect(procedure.performer?.[0]?.actor.reference).toBe("Practitioner/N10000001");
  });

  test("patches procedure with replace operations", async () => {
    let capturedMethod: string | undefined;
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        capturedMethod = init?.method;
        capturedBody = init?.body ? JSON.parse(String(init.body)) : undefined;

        return new Response(
          JSON.stringify({
            id: "6c9cb16e-7775-4c80-b5b2-3d04901df1f3",
            ...procedurePayload,
            status: "completed",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const updated = await client.procedure.patch({
      id: "6c9cb16e-7775-4c80-b5b2-3d04901df1f3",
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

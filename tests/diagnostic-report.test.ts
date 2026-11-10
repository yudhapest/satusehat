import { describe, test } from "node:test";

import { createSatuSehatClient, SatuSehatValidationError } from "../src";
import { expect } from "./helpers/expect";

const diagnosticReportPayload = {
  resourceType: "DiagnosticReport" as const,
  identifier: [
    {
      system: "http://sys-ids.kemkes.go.id/diagnostic/10000004/lab",
      use: "official",
      value: "DR-0001",
    },
  ],
  basedOn: [
    {
      reference: "ServiceRequest/6694e8c8-052a-4ea6-8072-157b6d47ca08",
    },
  ],
  status: "final" as const,
  category: [
    {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/v2-0074",
          code: "LAB",
          display: "Laboratory",
        },
      ],
    },
  ],
  code: {
    coding: [
      {
        system: "http://loinc.org",
        code: "58410-2",
        display: "Complete blood count (hemogram) panel - Blood by Automated count",
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
  effectiveDateTime: "2024-04-01T03:30:00+00:00",
  issued: "2024-04-01T03:45:00+00:00",
  performer: [
    {
      reference: "Organization/10000004",
      display: "RS SATUSEHAT",
    },
  ],
  resultsInterpreter: [
    {
      reference: "Practitioner/N10000001",
      display: "Dokter Bronsig",
    },
  ],
  specimen: [
    {
      reference: "Specimen/5edd0663-093f-40f9-bf04-0c103fd6ec32",
    },
  ],
  result: [
    {
      reference: "Observation/af8ac2e3-0e72-45d7-ab8a-332f52fccbcd",
    },
  ],
  conclusion: "Hasil pemeriksaan hematologi lengkap dalam batas normal.",
};

describe("diagnosticReport endpoint", () => {
  test("validates supported search modes", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(JSON.stringify({ resourceType: "Bundle", entry: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });

    await expect(client.diagnosticReport.search({} as never)).rejects.toBeInstanceOf(
      SatuSehatValidationError,
    );
    await expect(
      client.diagnosticReport.search({
        specimen: "5edd0663-093f-40f9-bf04-0c103fd6ec32",
      }),
    ).rejects.toBeInstanceOf(SatuSehatValidationError);
  });

  test('searches diagnostic report by subject and "specimen"', async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (input) => {
        const url = String(input);
        expect(url).toContain("subject=100000030009");
        expect(url).toContain("specimen=5edd0663-093f-40f9-bf04-0c103fd6ec32");

        return new Response(
          JSON.stringify({
            resourceType: "Bundle",
            total: 1,
            entry: [
              {
                resource: {
                  id: "dr-1",
                  ...diagnosticReportPayload,
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

    const result = await client.diagnosticReport.search({
      subject: "100000030009",
      specimen: "5edd0663-093f-40f9-bf04-0c103fd6ec32",
    });

    expect(result.total).toBe(1);
    expect(result.entry?.[0]?.resource.id).toBe("dr-1");
    expect(result.entry?.[0]?.resource.status).toBe("final");
  });

  test("posts a validated diagnostic report resource", async () => {
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        const requestBody = init?.body ? JSON.parse(String(init.body)) : undefined;
        capturedBody = requestBody;

        return new Response(
          JSON.stringify({
            id: "dr-1",
            ...(requestBody && typeof requestBody === "object" ? requestBody : {}),
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const diagnosticReport = await client.diagnosticReport.create(diagnosticReportPayload);

    expect((capturedBody as { resourceType: string }).resourceType).toBe("DiagnosticReport");
    expect(diagnosticReport.id).toBe("dr-1");
    expect(diagnosticReport.code.coding[0]?.code).toBe("58410-2");
  });

  test("patches diagnostic report with replace operations", async () => {
    let capturedMethod: string | undefined;
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        capturedMethod = init?.method;
        capturedBody = init?.body ? JSON.parse(String(init.body)) : undefined;

        return new Response(
          JSON.stringify({
            id: "dr-1",
            ...diagnosticReportPayload,
            conclusion: "Kesimpulan diperbarui.",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const updated = await client.diagnosticReport.patch({
      id: "dr-1",
      body: [
        {
          op: "replace",
          path: "/conclusion",
          value: "Kesimpulan diperbarui.",
        },
      ],
    });

    expect(capturedMethod).toBe("PATCH");
    expect(capturedBody).toEqual([
      {
        op: "replace",
        path: "/conclusion",
        value: "Kesimpulan diperbarui.",
      },
    ]);
    expect(updated.conclusion).toBe("Kesimpulan diperbarui.");
  });
});

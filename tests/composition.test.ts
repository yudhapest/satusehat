import { describe, test } from "node:test";

import { createSatuSehatClient, SatuSehatValidationError } from "../src";
import type { CompositionCreateInput } from "../src";
import { expect } from "./helpers/expect";

const compositionIdentifier = {
  system: "http://sys-ids.kemkes.go.id/composition/10000004",
  use: "official",
  value: "COMP-0001",
};

const compositionPayload: CompositionCreateInput = {
  resourceType: "Composition",
  identifier: [compositionIdentifier],
  status: "final",
  type: {
    coding: [
      {
        system: "http://loinc.org",
        code: "34133-9",
        display: "Summary of episode note",
      },
    ],
  },
  category: [
    {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/document-classcodes",
          code: "LP173421-1",
          display: "Report",
        },
      ],
    },
  ],
  subject: {
    reference: "Patient/100000030009",
    display: "Budi Santoso",
  },
  encounter: {
    reference: "Encounter/4f735a03-128b-464d-bf91-e6eacdf1c38f",
  },
  date: "2024-04-01T05:00:00+00:00",
  author: [
    {
      reference: "Practitioner/N10000001",
      display: "Dokter Bronsig",
    },
  ],
  title: "Resume Medis Rawat Jalan",
  attester: [
    {
      mode: "official",
      time: "2024-04-01T05:05:00+00:00",
      party: {
        reference: "Organization/10000004",
        display: "RS SATUSEHAT",
      },
    },
  ],
  event: [
    {
      period: {
        start: "2024-04-01T02:00:00+00:00",
        end: "2024-04-01T05:00:00+00:00",
      },
      detail: [
        {
          reference: "Procedure/16f8f9c1-dc12-45a5-a6d7-a0b9bf3d19be",
        },
      ],
    },
  ],
  section: [
    {
      title: "Ringkasan Klinis",
      code: {
        coding: [
          {
            system: "http://loinc.org",
            code: "11348-0",
            display: "History of past illness",
          },
        ],
      },
      text: {
        status: "generated",
        div: "<div>Pasien datang dengan keluhan batuk sejak 3 hari terakhir.</div>",
      },
      entry: [
        {
          reference: "Condition/6f8aa0da-7513-4d75-9655-6d17ca4e5900",
        },
        {
          reference: "Observation/af8ac2e3-0e72-45d7-ab8a-332f52fccbcd",
        },
      ],
    },
  ],
};

describe("composition endpoint", () => {
  test("validates that search requires subject or encounter", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(JSON.stringify({ resourceType: "Bundle", entry: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });

    await expect(client.composition.search({} as never)).rejects.toBeInstanceOf(
      SatuSehatValidationError,
    );
  });

  test("searches composition by subject and encounter", async () => {
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
                  id: "1ec67403-c6f1-4d46-8611-d20875525438",
                  ...compositionPayload,
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

    const result = await client.composition.search({
      subject: "100000030009",
      encounter: "4f735a03-128b-464d-bf91-e6eacdf1c38f",
    });

    expect(result.total).toBe(1);
    expect(result.entry?.[0]?.resource.id).toBe("1ec67403-c6f1-4d46-8611-d20875525438");
    expect(result.entry?.[0]?.resource.title).toBe("Resume Medis Rawat Jalan");
  });

  test("posts a validated composition resource", async () => {
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        const requestBody = init?.body ? JSON.parse(String(init.body)) : undefined;
        capturedBody = requestBody;

        return new Response(
          JSON.stringify({
            id: "1ec67403-c6f1-4d46-8611-d20875525438",
            ...(requestBody && typeof requestBody === "object" ? requestBody : {}),
            identifier:
              Array.isArray((requestBody as { identifier?: unknown }).identifier)
                ? (requestBody as { identifier: unknown[] }).identifier[0]
                : (requestBody as { identifier?: unknown }).identifier,
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const composition = await client.composition.create(compositionPayload);

    expect((capturedBody as { resourceType: string }).resourceType).toBe("Composition");
    expect(composition.id).toBe("1ec67403-c6f1-4d46-8611-d20875525438");
    expect(composition.section?.[0]?.title).toBe("Ringkasan Klinis");
    expect(composition.identifier).toEqual(compositionIdentifier);
  });

  test("accepts composition identifier as a single object", async () => {
    const payload: CompositionCreateInput = {
      ...compositionPayload,
      identifier: compositionIdentifier,
    };

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        const requestBody = init?.body ? JSON.parse(String(init.body)) : undefined;

        return new Response(
          JSON.stringify({
            id: "1ec67403-c6f1-4d46-8611-d20875525438",
            ...(requestBody && typeof requestBody === "object" ? requestBody : {}),
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const composition = await client.composition.create(payload);

    expect(composition.identifier).toEqual(compositionIdentifier);
  });

  test("patches composition with replace operations", async () => {
    let capturedMethod: string | undefined;
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        capturedMethod = init?.method;
        capturedBody = init?.body ? JSON.parse(String(init.body)) : undefined;

        return new Response(
          JSON.stringify({
            id: "1ec67403-c6f1-4d46-8611-d20875525438",
            ...compositionPayload,
            title: "Resume Medis Rawat Jalan Terverifikasi",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const updated = await client.composition.patch({
      id: "1ec67403-c6f1-4d46-8611-d20875525438",
      body: [
        {
          op: "replace",
          path: "/title",
          value: "Resume Medis Rawat Jalan Terverifikasi",
        },
      ],
    });

    expect(capturedMethod).toBe("PATCH");
    expect(capturedBody).toEqual([
      {
        op: "replace",
        path: "/title",
        value: "Resume Medis Rawat Jalan Terverifikasi",
      },
    ]);
    expect(updated.title).toBe("Resume Medis Rawat Jalan Terverifikasi");
  });
});

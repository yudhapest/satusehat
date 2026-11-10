import { describe, test } from "node:test";

import { createSatuSehatClient, SatuSehatValidationError } from "../src";
import type { CarePlanCreateInput } from "../src";
import { expect } from "./helpers/expect";

const carePlanPayload: CarePlanCreateInput = {
  resourceType: "CarePlan",
  identifier: [
    {
      system: "http://sys-ids.kemkes.go.id/careplan/1000004",
      use: "official",
      value: "98457729",
    },
  ],
  status: "draft",
  intent: "proposal",
  category: [
    {
      coding: [
        {
          system: "http://snomed.info/sct",
          code: "736372004",
          display: "Discharge care plan",
        },
      ],
    },
  ],
  title: "Rencana Tindak Lanjut",
  description: "Kontrol ulang 3 hari lagi atau bila keluhan memberat.",
  subject: {
    reference: "Patient/100000030009",
    display: "Budi Santoso",
  },
  encounter: {
    reference: "Encounter/4f735a03-128b-464d-bf91-e6eacdf1c38f",
  },
  created: "2024-04-01T01:15:00+00:00",
  author: {
    reference: "Practitioner/N10000001",
    display: "Dokter Bronsig",
  },
  activity: [
    {
      detail: {
        status: "not-started",
        description: "Kontrol ulang 3 hari lagi atau bila keluhan memberat.",
      },
    },
  ],
  note: [
    {
      text: "Edukasi pasien untuk kembali bila nyeri memburuk.",
    },
  ],
};

describe("carePlan endpoint", () => {
  test("validates that search requires patient, subject, or encounter", () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(JSON.stringify({ resourceType: "Bundle", entry: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });

    expect(() => client.carePlan.search({} as never)).toThrow(SatuSehatValidationError);
  });

  test("searches care plan and normalizes subject alias to patient", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (input) => {
        const url = String(input);
        expect(url).toContain("patient=100000030009");
        expect(url).toContain("encounter=4f735a03-128b-464d-bf91-e6eacdf1c38f");
        expect(url).not.toContain("subject=");

        return new Response(
          JSON.stringify({
            resourceType: "Bundle",
            total: 1,
            entry: [
              {
                resource: {
                  id: "4aa9ce4d-0712-4cfd-b7a0-396f9384f95f",
                  ...carePlanPayload,
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

    const result = await client.carePlan.search({
      subject: "100000030009",
      encounter: "4f735a03-128b-464d-bf91-e6eacdf1c38f",
    });

    expect(result.total).toBe(1);
    expect(result.entry?.[0]?.resource.id).toBe("4aa9ce4d-0712-4cfd-b7a0-396f9384f95f");
    expect(result.entry?.[0]?.resource.intent).toBe("proposal");
  });

  test("posts a validated care plan resource", async () => {
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        const requestBody = init?.body ? JSON.parse(String(init.body)) : undefined;
        capturedBody = requestBody;

        return new Response(
          JSON.stringify({
            id: "4aa9ce4d-0712-4cfd-b7a0-396f9384f95f",
            ...(requestBody && typeof requestBody === "object" ? requestBody : {}),
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const carePlan = await client.carePlan.create(carePlanPayload);

    expect((capturedBody as { resourceType: string }).resourceType).toBe("CarePlan");
    expect(carePlan.id).toBe("4aa9ce4d-0712-4cfd-b7a0-396f9384f95f");
    expect(carePlan.category[0]?.coding?.[0]?.code).toBe("736372004");
  });

  test("patches care plan with replace operations", async () => {
    let capturedMethod: string | undefined;
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        capturedMethod = init?.method;
        capturedBody = init?.body ? JSON.parse(String(init.body)) : undefined;

        return new Response(
          JSON.stringify({
            id: "4aa9ce4d-0712-4cfd-b7a0-396f9384f95f",
            ...carePlanPayload,
            status: "active",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const updated = await client.carePlan.patch({
      id: "4aa9ce4d-0712-4cfd-b7a0-396f9384f95f",
      body: [
        {
          op: "replace",
          path: "/status",
          value: "active",
        },
      ],
    });

    expect(capturedMethod).toBe("PATCH");
    expect(capturedBody).toEqual([
      {
        op: "replace",
        path: "/status",
        value: "active",
      },
    ]);
    expect(updated.status).toBe("active");
  });
});

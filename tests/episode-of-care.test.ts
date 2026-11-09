import { describe, test } from "node:test";

import { createSatuSehatClient, SatuSehatValidationError } from "../src";
import type { EpisodeOfCareCreateInput } from "../src";
import { expect } from "./helpers/expect";

const episodeOfCarePayload: EpisodeOfCareCreateInput = {
  resourceType: "EpisodeOfCare",
  identifier: [
    {
      system: "http://sys-ids.kemkes.go.id/episode-of-care/1000004",
      use: "official",
      value: "EOC-PTM-CAD-123",
    },
  ],
  status: "waitlist",
  statusHistory: [
    {
      status: "waitlist",
      period: {
        start: "2026-04-07T00:00:00.000+00:00",
      },
    },
  ],
  type: [
    {
      coding: [
        {
          system: "http://terminology.kemkes.go.id/CodeSystem/episodeofcare-type",
          code: "CAD",
          display: "Coronary Arterial Disease Management Care",
        },
      ],
    },
  ],
  diagnosis: [
    {
      condition: {
        reference: "Condition/4bbbe654-14f5-4ab3-a36e-a1e307f67bb8",
      },
      role: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/diagnosis-role",
            code: "AD",
            display: "Admission diagnosis",
          },
        ],
      },
      rank: 1,
    },
  ],
  patient: {
    reference: "Patient/100000030009",
    display: "Budi Santoso",
  },
  managingOrganization: {
    reference: "Organization/1000004",
  },
  period: {
    start: "2026-04-07T00:00:00.000+00:00",
  },
  careManager: {
    reference: "Practitioner/N10000001",
    display: "Dokter Bronsig",
  },
};

describe("episodeOfCare endpoint", () => {
  test("validates that search requires at least one parameter", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(JSON.stringify({ resourceType: "Bundle", entry: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });

    await expect(client.episodeOfCare.search({} as never)).rejects.toBeInstanceOf(
      SatuSehatValidationError,
    );
  });

  test("searches episode of care by subject and identifier", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (input) => {
        const url = String(input);
        expect(url).toContain("subject=100000030009");
        expect(url).toContain(
          "identifier=http%3A%2F%2Fsys-ids.kemkes.go.id%2Fepisode-of-care%2F1000004%7CEOC-PTM-CAD-123",
        );

        return new Response(
          JSON.stringify({
            resourceType: "Bundle",
            total: 1,
            entry: [
              {
                resource: {
                  id: "99d39101-4a41-4414-b1ef-6b45b7d73807",
                  ...episodeOfCarePayload,
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

    const result = await client.episodeOfCare.search({
      subject: "100000030009",
      identifier:
        "http://sys-ids.kemkes.go.id/episode-of-care/1000004|EOC-PTM-CAD-123",
    });

    expect(result.total).toBe(1);
    expect(result.entry?.[0]?.resource.id).toBe(
      "99d39101-4a41-4414-b1ef-6b45b7d73807",
    );
    expect(result.entry?.[0]?.resource.status).toBe("waitlist");
  });

  test("posts a validated episode of care resource", async () => {
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        const requestBody = init?.body ? JSON.parse(String(init.body)) : undefined;
        capturedBody = requestBody;

        return new Response(
          JSON.stringify({
            id: "99d39101-4a41-4414-b1ef-6b45b7d73807",
            ...(requestBody && typeof requestBody === "object" ? requestBody : {}),
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const episodeOfCare = await client.episodeOfCare.create(episodeOfCarePayload);

    expect((capturedBody as { resourceType: string }).resourceType).toBe(
      "EpisodeOfCare",
    );
    expect(episodeOfCare.id).toBe("99d39101-4a41-4414-b1ef-6b45b7d73807");
    expect(episodeOfCare.identifier?.[0]?.system).toBe(
      "http://sys-ids.kemkes.go.id/episode-of-care/1000004",
    );
  });

  test("rejects invalid identifier system before posting", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () => {
        throw new Error("fetch should not be called");
      },
    });

    await expect(
      client.episodeOfCare.create({
        ...episodeOfCarePayload,
        identifier: [
          {
            system: "http://sys-ids.kemkes.go.id/episodeofcare/1000004",
            use: "official",
            value: "EOC-PTM-CAD-123",
          },
        ],
      }),
    ).rejects.toBeInstanceOf(SatuSehatValidationError);
  });

  test("patches episode of care with replace operations", async () => {
    let capturedMethod: string | undefined;
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        capturedMethod = init?.method;
        capturedBody = init?.body ? JSON.parse(String(init.body)) : undefined;

        return new Response(
          JSON.stringify({
            id: "99d39101-4a41-4414-b1ef-6b45b7d73807",
            ...episodeOfCarePayload,
            status: "active",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const updated = await client.episodeOfCare.patch({
      id: "99d39101-4a41-4414-b1ef-6b45b7d73807",
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

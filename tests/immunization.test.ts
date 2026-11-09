import { describe, test } from "node:test";

import { createSatuSehatClient, SatuSehatValidationError } from "../src";
import type { ImmunizationCreateInput } from "../src";
import { expect } from "./helpers/expect";

const immunizationPayload: ImmunizationCreateInput = {
  resourceType: "Immunization",
  identifier: [
    {
      system: "http://sys-ids.kemkes.go.id/immunization/1000004",
      use: "official",
      value: "IMM-HB0-001",
    },
  ],
  status: "completed",
  vaccineCode: {
    coding: [
      {
        system: "http://sys-ids.kemkes.go.id/kfa",
        code: "93023161",
        display: "Hepatitis B Uniject 0,5 mL",
      },
      {
        system: "http://hl7.org/fhir/sid/cvx",
        code: "08",
        display: "Hep B, adolescent or pediatric",
      },
    ],
  },
  patient: {
    reference: "Patient/100000030009",
    display: "Budi Santoso",
  },
  encounter: {
    reference: "Encounter/4f735a03-128b-464d-bf91-e6eacdf1c38f",
  },
  occurrenceDateTime: "2026-04-09T03:32:00+07:00",
  recorded: "2026-04-09T03:32:00+07:00",
  primarySource: true,
  reasonCode: [
    {
      coding: [
        {
          system: "http://terminology.kemkes.go.id/CodeSystem/immunization-reason",
          code: "IM-Dasar",
          display: "Imunisasi Program Rutin Dasar",
        },
      ],
    },
  ],
  lotNumber: "HB0-LOT-001",
  expirationDate: "2027-04-09",
  route: {
    coding: [
      {
        system: "http://www.whocc.no/atc",
        code: "IM",
        display: "Intramuscular use",
      },
    ],
  },
  doseQuantity: {
    value: 0.5,
    unit: "mL",
    system: "http://unitsofmeasure.org",
    code: "mL",
  },
  performer: [
    {
      function: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/v2-0443",
            code: "AP",
            display: "Administering Provider",
          },
        ],
      },
      actor: {
        reference: "Practitioner/N10000001",
        display: "Dokter Satu Sehat",
      },
    },
  ],
  protocolApplied: [
    {
      series: "Hepatitis B",
      authority: {
        reference: "Organization/1000004",
      },
      targetDisease: [
        {
          coding: [
            {
              system: "http://hl7.org/fhir/sid/icd-10",
              code: "B16.9",
              display:
                "Acute hepatitis B without delta-agent and without hepatic coma",
            },
          ],
        },
      ],
      doseNumberPositiveInt: 1,
      seriesDosesPositiveInt: 1,
    },
  ],
};

describe("immunization endpoint", () => {
  test("validates that search requires at least one supported parameter", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(JSON.stringify({ resourceType: "Bundle", entry: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });

    await expect(client.immunization.search({} as never)).rejects.toBeInstanceOf(
      SatuSehatValidationError,
    );
  });

  test("searches immunization by patient and encounter", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (input) => {
        const url = String(input);
        expect(url).toContain("patient=100000030009");
        expect(url).toContain("encounter=4f735a03-128b-464d-bf91-e6eacdf1c38f");

        return new Response(
          JSON.stringify({
            resourceType: "Bundle",
            total: 1,
            entry: [
              {
                resource: {
                  id: "a9f62a9f-5a1a-4d60-94fd-7d018df7963c",
                  ...immunizationPayload,
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

    const result = await client.immunization.search({
      patient: "100000030009",
      encounter: "4f735a03-128b-464d-bf91-e6eacdf1c38f",
    });

    expect(result.total).toBe(1);
    expect(result.entry?.[0]?.resource.id).toBe(
      "a9f62a9f-5a1a-4d60-94fd-7d018df7963c",
    );
    expect(result.entry?.[0]?.resource.status).toBe("completed");
  });

  test("posts a validated immunization resource", async () => {
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        const requestBody = init?.body ? JSON.parse(String(init.body)) : undefined;
        capturedBody = requestBody;

        return new Response(
          JSON.stringify({
            id: "a9f62a9f-5a1a-4d60-94fd-7d018df7963c",
            ...(requestBody && typeof requestBody === "object" ? requestBody : {}),
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const immunization = await client.immunization.create(immunizationPayload);

    expect((capturedBody as { resourceType: string }).resourceType).toBe("Immunization");
    expect(immunization.id).toBe("a9f62a9f-5a1a-4d60-94fd-7d018df7963c");
    expect(immunization.reasonCode?.[0]?.coding?.[0]?.code).toBe("IM-Dasar");
  });

  test("rejects completed immunization without reasonCode", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(JSON.stringify({ id: "ignored", ...immunizationPayload }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });
    const { reasonCode: _reasonCode, ...payloadWithoutReason } = immunizationPayload;

    await expect(
      client.immunization.create(payloadWithoutReason as ImmunizationCreateInput),
    ).rejects.toBeInstanceOf(SatuSehatValidationError);
  });

  test("rejects expirationDate before occurrenceDateTime", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(JSON.stringify({ id: "ignored", ...immunizationPayload }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });

    await expect(
      client.immunization.create({
        ...immunizationPayload,
        expirationDate: "2026-04-08",
      }),
    ).rejects.toBeInstanceOf(SatuSehatValidationError);
  });

  test("patches immunization with replace operations", async () => {
    let capturedMethod: string | undefined;
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        capturedMethod = init?.method;
        capturedBody = init?.body ? JSON.parse(String(init.body)) : undefined;

        return new Response(
          JSON.stringify({
            id: "a9f62a9f-5a1a-4d60-94fd-7d018df7963c",
            ...immunizationPayload,
            status: "entered-in-error",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const updated = await client.immunization.patch({
      id: "a9f62a9f-5a1a-4d60-94fd-7d018df7963c",
      body: [
        {
          op: "replace",
          path: "/status",
          value: "entered-in-error",
        },
      ],
    });

    expect(capturedMethod).toBe("PATCH");
    expect(capturedBody).toEqual([
      {
        op: "replace",
        path: "/status",
        value: "entered-in-error",
      },
    ]);
    expect(updated.status).toBe("entered-in-error");
  });
});

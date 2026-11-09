import { describe, test } from "node:test";

import { createSatuSehatClient, SatuSehatValidationError } from "../src";
import { expect } from "./helpers/expect";

const conditionPayload = {
  resourceType: "Condition" as const,
  identifier: [
    {
      system: "http://sys-ids.kemkes.go.id/condition/10000004",
      use: "official",
      value: "5234342",
    },
  ],
  clinicalStatus: {
    coding: [
      {
        system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
        code: "active",
        display: "Active",
      },
    ],
  },
  verificationStatus: {
    coding: [
      {
        system: "https://www.hl7.org/fhir/Codesystem-condition-ver-status",
        code: "provisional",
        display: "Provisional",
      },
    ],
  },
  category: [
    {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/condition-category",
          code: "encounter-diagnosis",
          display: "Encounter Diagnosis",
        },
      ],
    },
  ],
  code: {
    coding: [
      {
        system: "http://hl7.org/fhir/sid/icd-10",
        code: "C47.0",
        display: "Malignant neoplasm, peripheral nerves of head, face and neck",
      },
    ],
  },
  subject: {
    reference: "Patient/100000030009",
    display: "Budi Santoso",
  },
  encounter: {
    reference: "Encounter/2b2d0a3e-082a-4fe9-ae13-da9c3b5e422f",
  },
  onsetDateTime: "2024-04-01T01:15:00+00:00",
  recordedDate: "2024-04-01T01:20:00+00:00",
  recorder: {
    reference: "Practitioner/N10000001",
    display: "Dokter Bronsig",
  },
  note: [
    {
      text: "Diagnosis awal saat kunjungan.",
    },
  ],
};

describe("condition endpoint", () => {
  test("validates that search requires subject or encounter", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(JSON.stringify({ resourceType: "Bundle", entry: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });

    await expect(client.condition.search({} as never)).rejects.toBeInstanceOf(
      SatuSehatValidationError,
    );
  });

  test("searches condition by subject and encounter", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (input) => {
        const url = String(input);
        expect(url).toContain("subject=100000030009");
        expect(url).toContain("encounter=2b2d0a3e-082a-4fe9-ae13-da9c3b5e422f");

        return new Response(
          JSON.stringify({
            resourceType: "Bundle",
            total: 1,
            entry: [
              {
                resource: {
                  id: "2a4e1a13-ee52-4c8b-a2ef-f41c79de698d",
                  ...conditionPayload,
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

    const result = await client.condition.search({
      subject: "100000030009",
      encounter: "2b2d0a3e-082a-4fe9-ae13-da9c3b5e422f",
    });

    expect(result.total).toBe(1);
    expect(result.entry?.[0]?.resource.id).toBe("2a4e1a13-ee52-4c8b-a2ef-f41c79de698d");
    expect(result.entry?.[0]?.resource.code.coding[0]?.code).toBe("C47.0");
  });

  test("accepts any hex UUID-shaped encounter id, not only RFC 9562 UUIDs", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(JSON.stringify({ resourceType: "Bundle", total: 0, entry: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });

    // Version nibble "0" and variant nibble "0" are outside RFC 9562.
    const result = await client.condition.search({
      encounter: "2b2d0a3e-082a-0fe9-0e13-da9c3b5e422f",
    });

    expect(result.total).toBe(0);
    await expect(client.condition.search({ encounter: "not-a-uuid" })).rejects.toBeInstanceOf(
      SatuSehatValidationError,
    );
  });

  test("moves consent-suppressed OperationOutcome entries out of search results", async () => {
    // Shape returned by the SATUSEHAT sandbox: suppressed results are mixed into `entry`.
    const suppressed = (conditionId: string) => ({
      resource: {
        resourceType: "OperationOutcome",
        issue: [
          {
            severity: "information",
            code: "suppressed",
            details: {
              text: "The operation did not return any information due to consent or privacy rules.",
            },
            diagnostics: `No consent available for Condition/${conditionId}`,
          },
        ],
      },
    });

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(
          JSON.stringify({
            resourceType: "Bundle",
            type: "searchset",
            total: 1,
            entry: [
              suppressed("e197e9ba-c4f2-4b8e-9d55-1f0c2a4b7e01"),
              { resource: { id: "2a4e1a13-ee52-4c8b-a2ef-f41c79de698d", ...conditionPayload } },
              suppressed("57eed4cd-ca31-4d6a-8a1e-0b9f2c3d4e02"),
            ],
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
    });

    const result = await client.condition.search({ subject: "100000030009" });

    expect(result.entry).toHaveLength(1);
    expect(result.entry?.[0]?.resource.code.coding[0]?.code).toBe("C47.0");
    expect(result.outcomes).toHaveLength(2);
    expect(result.outcomes?.[0]?.issue[0]?.code).toBe("suppressed");
    expect(result.outcomes?.[1]?.issue[0]?.diagnostics).toContain(
      "Condition/57eed4cd-ca31-4d6a-8a1e-0b9f2c3d4e02",
    );
  });

  test("omits outcomes when a search bundle has none", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(
          JSON.stringify({
            resourceType: "Bundle",
            total: 1,
            entry: [
              { resource: { id: "2a4e1a13-ee52-4c8b-a2ef-f41c79de698d", ...conditionPayload } },
            ],
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
    });

    const result = await client.condition.search({ subject: "100000030009" });

    expect(result.entry).toHaveLength(1);
    expect(result.outcomes).toBeUndefined();
  });

  test("still rejects invalid search results mixed with OperationOutcome entries", async () => {
    const { code: _code, ...conditionWithoutCode } = conditionPayload;
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(
          JSON.stringify({
            resourceType: "Bundle",
            entry: [
              {
                resource: {
                  resourceType: "OperationOutcome",
                  issue: [{ severity: "information", code: "suppressed" }],
                },
              },
              { resource: { id: "2a4e1a13-ee52-4c8b-a2ef-f41c79de698d", ...conditionWithoutCode } },
            ],
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
    });

    const error = await client.condition.search({ subject: "100000030009" }).then(
      () => undefined,
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(SatuSehatValidationError);
    expect((error as SatuSehatValidationError).issues[0]?.path).toEqual([
      "entry",
      0,
      "resource",
      "code",
    ]);
  });

  test("posts a validated condition resource", async () => {
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        const requestBody = init?.body ? JSON.parse(String(init.body)) : undefined;
        capturedBody = requestBody;

        return new Response(
          JSON.stringify({
            id: "2a4e1a13-ee52-4c8b-a2ef-f41c79de698d",
            ...(requestBody && typeof requestBody === "object" ? requestBody : {}),
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const condition = await client.condition.create(conditionPayload);

    expect((capturedBody as { resourceType: string }).resourceType).toBe("Condition");
    expect(condition.id).toBe("2a4e1a13-ee52-4c8b-a2ef-f41c79de698d");
    expect(condition.subject.reference).toBe("Patient/100000030009");
  });

  test("patches condition with replace operations", async () => {
    let capturedMethod: string | undefined;
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        capturedMethod = init?.method;
        capturedBody = init?.body ? JSON.parse(String(init.body)) : undefined;

        return new Response(
          JSON.stringify({
            id: "2a4e1a13-ee52-4c8b-a2ef-f41c79de698d",
            ...conditionPayload,
            recordedDate: "2024-04-01T02:00:00+00:00",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const updated = await client.condition.patch({
      id: "2a4e1a13-ee52-4c8b-a2ef-f41c79de698d",
      body: [
        {
          op: "replace",
          path: "/recordedDate",
          value: "2024-04-01T02:00:00+00:00",
        },
      ],
    });

    expect(capturedMethod).toBe("PATCH");
    expect(capturedBody).toEqual([
      {
        op: "replace",
        path: "/recordedDate",
        value: "2024-04-01T02:00:00+00:00",
      },
    ]);
    expect(updated.recordedDate).toBe("2024-04-01T02:00:00+00:00");
  });
});

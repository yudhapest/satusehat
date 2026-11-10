import { describe, test } from "node:test";

import { createSatuSehatClient, SatuSehatValidationError } from "../src";
import { expect } from "./helpers/expect";

const serviceRequestPayload = {
  resourceType: "ServiceRequest" as const,
  identifier: [
    {
      system: "http://sys-ids.kemkes.go.id/servicerequest/10000004",
      use: "official",
      value: "SR-0001",
    },
    {
      system: "http://sys-ids.kemkes.go.id/acsn/10000004",
      use: "official",
      value: "1130681",
      type: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/v2-0203",
            code: "ACSN",
          },
        ],
      },
    },
  ],
  status: "active" as const,
  intent: "order" as const,
  category: [
    {
      coding: [
        {
          system: "http://snomed.info/sct",
          code: "108252007",
          display: "Laboratory procedure",
        },
      ],
    },
  ],
  priority: "routine" as const,
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
    reference: "Encounter/6694e8c8-052a-4ea6-8072-157b6d47ca08",
  },
  occurrenceDateTime: "2024-04-01T03:00:00+00:00",
  authoredOn: "2024-04-01T02:45:00+00:00",
  requester: {
    reference: "Practitioner/N10000001",
    display: "Dokter Bronsig",
  },
  performer: [
    {
      reference: "Organization/10000004",
      display: "RS SATUSEHAT",
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
  note: [
    {
      text: "Mohon dikerjakan hari ini.",
    },
  ],
};

describe("serviceRequest endpoint", () => {
  test("validates supported search modes", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(JSON.stringify({ resourceType: "Bundle", entry: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });

    await expect(client.serviceRequest.search({} as never)).rejects.toBeInstanceOf(
      SatuSehatValidationError,
    );
    await expect(
      client.serviceRequest.search({
        identifier: "http://sys-ids.kemkes.go.id/img-accession-no/100000030009|CR.221005.002",
      }),
    ).rejects.toBeInstanceOf(SatuSehatValidationError);
  });

  test("searches service request by subject and identifier", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (input) => {
        const url = String(input);
        expect(url).toContain("subject=100000030009");
        expect(url).toContain(
          "identifier=http%3A%2F%2Fsys-ids.kemkes.go.id%2Fimg-accession-no%2F100000030009%7CCR.221005.002",
        );

        return new Response(
          JSON.stringify({
            resourceType: "Bundle",
            total: 1,
            entry: [
              {
                resource: {
                  id: "6694e8c8-052a-4ea6-8072-157b6d47ca08",
                  ...serviceRequestPayload,
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

    const result = await client.serviceRequest.search({
      subject: "100000030009",
      identifier: "http://sys-ids.kemkes.go.id/img-accession-no/100000030009|CR.221005.002",
    });

    expect(result.total).toBe(1);
    expect(result.entry?.[0]?.resource.id).toBe("6694e8c8-052a-4ea6-8072-157b6d47ca08");
    expect(result.entry?.[0]?.resource.intent).toBe("order");
  });

  test("posts a validated service request resource", async () => {
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        const requestBody = init?.body ? JSON.parse(String(init.body)) : undefined;
        capturedBody = requestBody;

        return new Response(
          JSON.stringify({
            id: "6694e8c8-052a-4ea6-8072-157b6d47ca08",
            ...(requestBody && typeof requestBody === "object" ? requestBody : {}),
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const serviceRequest = await client.serviceRequest.create(serviceRequestPayload);

    expect((capturedBody as { resourceType: string }).resourceType).toBe("ServiceRequest");
    expect((capturedBody as { identifier?: unknown[] }).identifier).toEqual([
      {
        system: "http://sys-ids.kemkes.go.id/servicerequest/10000004",
        use: "official",
        value: "SR-0001",
      },
      {
        system: "http://sys-ids.kemkes.go.id/acsn/10000004",
        use: "official",
        value: "1130681",
        type: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/v2-0203",
              code: "ACSN",
            },
          ],
        },
      },
    ]);
    expect(serviceRequest.id).toBe("6694e8c8-052a-4ea6-8072-157b6d47ca08");
    expect(serviceRequest.code.coding[0]?.code).toBe("58410-2");
  });

  test("patches service request with replace operations", async () => {
    let capturedMethod: string | undefined;
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        capturedMethod = init?.method;
        capturedBody = init?.body ? JSON.parse(String(init.body)) : undefined;

        return new Response(
          JSON.stringify({
            id: "6694e8c8-052a-4ea6-8072-157b6d47ca08",
            ...serviceRequestPayload,
            status: "completed",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const updated = await client.serviceRequest.patch({
      id: "6694e8c8-052a-4ea6-8072-157b6d47ca08",
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

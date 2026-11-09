import { describe, test } from "node:test";

import { createSatuSehatClient, SatuSehatValidationError } from "../src";
import { expect } from "./helpers/expect";

const imagingStudyPayload = {
  resourceType: "ImagingStudy" as const,
  identifier: [
    {
      system: "http://sys-ids.kemkes.go.id/acsn/10000004",
      use: "usual",
      value: "CR.221005.002",
    },
  ],
  status: "available" as const,
  modality: [
    {
      system: "http://dicom.nema.org/resources/ontology/DCM",
      code: "CR",
      display: "Computed Radiography",
    },
  ],
  subject: {
    reference: "Patient/100000030009",
    display: "Budi Santoso",
  },
  encounter: {
    reference: "Encounter/4f735a03-128b-464d-bf91-e6eacdf1c38f",
  },
  started: "2024-04-01T04:15:00+00:00",
  basedOn: [
    {
      reference: "ServiceRequest/83218f28-0027-4d3d-9981-94517f14223e",
    },
  ],
  referrer: {
    reference: "Practitioner/N10000001",
    display: "Dokter Bronsig",
  },
  interpreter: [
    {
      reference: "Practitioner/N10000002",
      display: "Dr. Radiologi",
    },
  ],
  numberOfSeries: 1,
  numberOfInstances: 2,
  description: "Pemeriksaan radiografi thorax AP/PA.",
  procedureReference: [
    {
      reference: "Procedure/eaf09a48-0025-11ed-b939-0242ac120002",
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
  series: [
    {
      uid: "1.2.48.670589.30.39.0.1.966169786508.1664950724077.1",
      modality: {
        system: "http://dicom.nema.org/resources/ontology/DCM",
        code: "CR",
        display: "Computed Radiography",
      },
      numberOfInstances: 2,
      performer: [
        {
          actor: {
            reference: "Practitioner/N10000002",
            display: "Radiografer SATUSEHAT",
          },
        },
      ],
      instance: [
        {
          uid: "2.16.380.31256.1.2449191199178232.20210610114930875.1.1",
          sopClass: {
            system: "urn:ietf:rfc:3986",
            code: "urn:oid:1.2.840.10008.5.1.4.1.1.1",
          },
          number: 1,
          title: "ORIGINAL\\\\PRIMARY",
        },
      ],
    },
  ],
};

describe("imagingStudy endpoint", () => {
  test("validates that search requires supported identifier format", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(JSON.stringify({ resourceType: "Bundle", entry: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });

    await expect(client.imagingStudy.search({} as never)).rejects.toBeInstanceOf(
      SatuSehatValidationError,
    );
    await expect(
      client.imagingStudy.search({
        identifier: "invalid-identifier",
      }),
    ).rejects.toBeInstanceOf(SatuSehatValidationError);
  });

  test("searches imaging study by identifier", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (input) => {
        const url = new URL(String(input));
        expect(url.searchParams.get("identifier")).toBe(
          "http://sys-ids.kemkes.go.id/acsn/100000030009|CR.221005.002",
        );

        return new Response(
          JSON.stringify({
            resourceType: "Bundle",
            total: 1,
            entry: [
              {
                resource: {
                  id: "8031179c-cd31-475e-8f94-feeb4c618c6b",
                  ...imagingStudyPayload,
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

    const result = await client.imagingStudy.search({
      identifier: "http://sys-ids.kemkes.go.id/acsn/100000030009|CR.221005.002",
    });

    expect(result.total).toBe(1);
    expect(result.entry?.[0]?.resource.id).toBe("8031179c-cd31-475e-8f94-feeb4c618c6b");
    expect(result.entry?.[0]?.resource.status).toBe("available");
  });

  test("posts a validated imaging study resource", async () => {
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        const requestBody = init?.body ? JSON.parse(String(init.body)) : undefined;
        capturedBody = requestBody;

        return new Response(
          JSON.stringify({
            id: "8031179c-cd31-475e-8f94-feeb4c618c6b",
            ...(requestBody && typeof requestBody === "object" ? requestBody : {}),
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const imagingStudy = await client.imagingStudy.create(imagingStudyPayload);

    expect((capturedBody as { resourceType: string }).resourceType).toBe("ImagingStudy");
    expect(imagingStudy.id).toBe("8031179c-cd31-475e-8f94-feeb4c618c6b");
    expect(imagingStudy.series?.[0]?.uid).toBe(
      "1.2.48.670589.30.39.0.1.966169786508.1664950724077.1",
    );
  });

  test("updates imaging study with a full resource body", async () => {
    let capturedMethod: string | undefined;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        capturedMethod = init?.method;

        return new Response(
          JSON.stringify({
            id: "8031179c-cd31-475e-8f94-feeb4c618c6b",
            ...imagingStudyPayload,
            description: "Pemeriksaan radiografi thorax AP/PA dengan catatan tambahan.",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const updated = await client.imagingStudy.update({
      id: "8031179c-cd31-475e-8f94-feeb4c618c6b",
      body: {
        ...imagingStudyPayload,
        description: "Pemeriksaan radiografi thorax AP/PA dengan catatan tambahan.",
      },
    });

    expect(capturedMethod).toBe("PUT");
    expect(updated.description).toBe("Pemeriksaan radiografi thorax AP/PA dengan catatan tambahan.");
  });

  test("patches imaging study with replace operations", async () => {
    let capturedMethod: string | undefined;
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        capturedMethod = init?.method;
        capturedBody = init?.body ? JSON.parse(String(init.body)) : undefined;

        return new Response(
          JSON.stringify({
            id: "8031179c-cd31-475e-8f94-feeb4c618c6b",
            ...imagingStudyPayload,
            description: "Deskripsi radiologi diperbarui.",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const updated = await client.imagingStudy.patch({
      id: "8031179c-cd31-475e-8f94-feeb4c618c6b",
      body: [
        {
          op: "replace",
          path: "/description",
          value: "Deskripsi radiologi diperbarui.",
        },
      ],
    });

    expect(capturedMethod).toBe("PATCH");
    expect(capturedBody).toEqual([
      {
        op: "replace",
        path: "/description",
        value: "Deskripsi radiologi diperbarui.",
      },
    ]);
    expect(updated.description).toBe("Deskripsi radiologi diperbarui.");
  });
});

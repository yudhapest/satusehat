import { describe, test } from "node:test";

import {
  createSatuSehatClient,
  SatuSehatApiError,
  SatuSehatValidationError,
} from "../src";
import type { QuestionnaireResponseCreateInput } from "../src";
import { expect } from "./helpers/expect";

const questionnaireResponsePayload: QuestionnaireResponseCreateInput = {
  resourceType: "QuestionnaireResponse",
  questionnaire: "Questionnaire/Q123",
  status: "completed",
  subject: {
    reference: "Patient/100000030009",
    display: "Budi Santoso",
  },
  encounter: {
    reference: "Encounter/4f735a03-128b-464d-bf91-e6eacdf1c38f",
  },
  authored: "2024-04-01T01:20:00+00:00",
  author: {
    reference: "Practitioner/N10000001",
    display: "Dokter Bronsig",
  },
  item: [
    {
      linkId: "1",
      text: "Apakah pasien mengalami nyeri dada?",
      answer: [
        {
          valueBoolean: true,
        },
      ],
    },
    {
      linkId: "2",
      text: "Berapa skala nyeri?",
      answer: [
        {
          valueInteger: 5,
        },
      ],
    },
  ],
};

describe("questionnaireResponse endpoint", () => {
  test("validates that search requires patient and encounter", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response(JSON.stringify({ resourceType: "Bundle", entry: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });

    await expect(client.questionnaireResponse.search({ patient: "100000030009" } as never)).rejects.toBeInstanceOf(
      SatuSehatValidationError,
    );
  });

  test("searches questionnaire response by patient and encounter", async () => {
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
                  id: "bc5edf78-ea8d-4827-97b3-3c73a810fa29",
                  ...questionnaireResponsePayload,
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

    const result = await client.questionnaireResponse.search({
      patient: "100000030009",
      encounter: "4f735a03-128b-464d-bf91-e6eacdf1c38f",
    });

    expect(result.total).toBe(1);
    expect(result.entry?.[0]?.resource.id).toBe("bc5edf78-ea8d-4827-97b3-3c73a810fa29");
    expect(result.entry?.[0]?.resource.status).toBe("completed");
  });

  test("posts a validated questionnaire response resource", async () => {
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        const requestBody = init?.body ? JSON.parse(String(init.body)) : undefined;
        capturedBody = requestBody;

        return new Response(
          JSON.stringify({
            id: "bc5edf78-ea8d-4827-97b3-3c73a810fa29",
            ...(requestBody && typeof requestBody === "object" ? requestBody : {}),
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const questionnaireResponse = await client.questionnaireResponse.create(
      questionnaireResponsePayload,
    );

    expect((capturedBody as { resourceType: string }).resourceType).toBe("QuestionnaireResponse");
    expect(questionnaireResponse.id).toBe("bc5edf78-ea8d-4827-97b3-3c73a810fa29");
    expect(questionnaireResponse.subject?.reference).toBe("Patient/100000030009");
  });

  test("patches questionnaire response with replace operations", async () => {
    let capturedMethod: string | undefined;
    let capturedBody: unknown;

    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        capturedMethod = init?.method;
        capturedBody = init?.body ? JSON.parse(String(init.body)) : undefined;

        return new Response(
          JSON.stringify({
            id: "bc5edf78-ea8d-4827-97b3-3c73a810fa29",
            ...questionnaireResponsePayload,
            status: "amended",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    });

    const updated = await client.questionnaireResponse.patch({
      id: "bc5edf78-ea8d-4827-97b3-3c73a810fa29",
      body: [
        {
          op: "replace",
          path: "/status",
          value: "amended",
        },
      ],
    });

    expect(capturedMethod).toBe("PATCH");
    expect(capturedBody).toEqual([
      {
        op: "replace",
        path: "/status",
        value: "amended",
      },
    ]);
    expect(updated.status).toBe("amended");
  });

  test("returns plain text API errors when SATUSEHAT sends invalid JSON with JSON content-type", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () =>
        new Response("Internal Server Error", {
          status: 500,
          headers: { "content-type": "application/json" },
        }),
    });

    try {
      await client.questionnaireResponse.create(questionnaireResponsePayload);
      throw new Error("Expected questionnaireResponse.create to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(SatuSehatApiError);
      expect((error as SatuSehatApiError).status).toBe(500);
      expect((error as SatuSehatApiError).response).toBe("Internal Server Error");
    }
  });
});

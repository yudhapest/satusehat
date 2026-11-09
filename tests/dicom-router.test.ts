import { describe, test } from "node:test";

import { createSatuSehatClient, resolveSatuSehatDicomBaseUrl, type HeadersInit } from "../src";
import { expect } from "./helpers/expect";

describe("dicomRouter.downloadConfig", () => {
  test("downloads docker-compose.yml as plain text from the default DICOM endpoint", async () => {
    let capturedHeaders: HeadersInit | undefined;

    const client = createSatuSehatClient({
      environment: "sandbox",
      accessToken: "test-token",
      fetch: async (input, init) => {
        expect(String(input)).toBe(`${resolveSatuSehatDicomBaseUrl("sandbox")}/dicom-router`);
        capturedHeaders = init?.headers;

        return new Response("services:\n  dicom-router:\n    image: satusehat/dicom-router\n", {
          status: 200,
          headers: { "content-type": "text/plain" },
        });
      },
    });

    const result = await client.dicomRouter.downloadConfig();
    const headers = new Headers(capturedHeaders);

    expect(headers.get("authorization")).toBe("Bearer test-token");
    expect(headers.get("accept")).toContain("text/plain");
    expect(result).toContain("dicom-router");
  });

  test("uses dicomBaseUrl override when provided", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      dicomBaseUrl: "https://proxy.example.com/satusehat",
      fetch: async (input) => {
        expect(String(input)).toBe("https://proxy.example.com/satusehat/dicom-router");

        return new Response("version: '3.8'\n", {
          status: 200,
          headers: { "content-type": "application/x-yaml" },
        });
      },
    });

    const result = await client.dicomRouter.downloadConfig();

    expect(result).toContain("version:");
  });
});

import { resolveSatuSehatBaseUrl, type SatuSehatEnvSource } from "../src";
import {
  SatuSehatApiError,
  SatuSehatConfigError,
  SatuSehatValidationError,
} from "../src/core/errors";

// Shared setup for the sandbox scripts. They must never reach the production API.

export interface SandboxEnv extends SatuSehatEnvSource {
  SATUSEHAT_ORGANIZATION_ID?: string;
  SATUSEHAT_TEST_PRACTITIONER_IDENTIFIER?: string;
}

export const DEFAULT_SANDBOX_PATIENT_IDENTIFIER =
  "https://fhir.kemkes.go.id/id/nik|9271060312000001";
export const DEFAULT_SANDBOX_PRACTITIONER_IDENTIFIER =
  "https://fhir.kemkes.go.id/id/nik|7209061211900001";

export function assertSandbox(source: SandboxEnv): string {
  const baseUrl = source.SATUSEHAT_BASE_URL ?? resolveSatuSehatBaseUrl("sandbox");

  if ((source.SATUSEHAT_ENV ?? "sandbox") !== "sandbox" || !baseUrl.includes("-stg.")) {
    throw new SatuSehatConfigError(
      "Sandbox scripts only run against the SATUSEHAT sandbox. Set SATUSEHAT_ENV=sandbox.",
    );
  }

  if (!source.SATUSEHAT_ORGANIZATION_ID) {
    throw new SatuSehatConfigError("Set SATUSEHAT_ORGANIZATION_ID to run the sandbox scripts.");
  }

  return source.SATUSEHAT_ORGANIZATION_ID;
}

export function describeError(error: unknown): string {
  if (error instanceof SatuSehatValidationError) {
    return `validation failed: ${JSON.stringify(error.issues.slice(0, 3))}`;
  }

  if (error instanceof SatuSehatApiError) {
    return `API error ${error.status}: ${JSON.stringify(error.response)}`;
  }

  return String(error);
}

import {
  createSatuSehatClientFromEnv,
  resolveSatuSehatBaseUrl,
  type SatuSehatEnvSource,
} from "../src";
import {
  SatuSehatApiError,
  SatuSehatConfigError,
  SatuSehatValidationError,
} from "../src/core/errors";

// Read-only checks against the SATUSEHAT sandbox: every call is a GET, nothing is created.
// Each check validates the real response against the library schemas.

interface SandboxCheckEnv extends SatuSehatEnvSource {
  SATUSEHAT_ORGANIZATION_ID?: string;
  SATUSEHAT_TEST_PRACTITIONER_IDENTIFIER?: string;
}

interface SearchResult {
  total?: number | undefined;
  entry?: Array<{ resource: { id?: string | undefined } }> | undefined;
  outcomes?: unknown[] | undefined;
}

const env = process.env as SandboxCheckEnv;
const client = createSatuSehatClientFromEnv(env);

let failedCount = 0;

async function check<T>(
  label: string,
  run: () => Promise<T>,
  describe: (result: NoInfer<T>) => string,
): Promise<T | undefined> {
  try {
    const result = await run();
    console.log(`PASS  ${label} -> ${describe(result)}`);
    return result;
  } catch (error) {
    failedCount += 1;
    console.log(`FAIL  ${label} -> ${describeError(error)}`);
    return undefined;
  }
}

function describeError(error: unknown): string {
  if (error instanceof SatuSehatValidationError) {
    return `response validation failed: ${JSON.stringify(error.issues.slice(0, 3))}`;
  }

  if (error instanceof SatuSehatApiError) {
    return `API error ${error.status}: ${JSON.stringify(error.response)}`;
  }

  return String(error);
}

function describeSearch(result: SearchResult): string {
  const outcomes = result.outcomes?.length ? `, outcomes=${result.outcomes.length}` : "";

  return `total=${result.total ?? 0}, entries=${result.entry?.length ?? 0}${outcomes}`;
}

function assertSandbox(source: SandboxCheckEnv): void {
  const baseUrl = source.SATUSEHAT_BASE_URL ?? resolveSatuSehatBaseUrl("sandbox");

  if ((source.SATUSEHAT_ENV ?? "sandbox") !== "sandbox" || !baseUrl.includes("-stg.")) {
    throw new SatuSehatConfigError(
      "sandbox-check only runs against the SATUSEHAT sandbox. Set SATUSEHAT_ENV=sandbox.",
    );
  }

  if (!source.SATUSEHAT_ORGANIZATION_ID) {
    throw new SatuSehatConfigError("Set SATUSEHAT_ORGANIZATION_ID to run sandbox-check.");
  }
}

async function main(): Promise<void> {
  assertSandbox(env);

  const organizationId = env.SATUSEHAT_ORGANIZATION_ID ?? "";
  const patientIdentifier =
    env.SATUSEHAT_TEST_PATIENT_IDENTIFIER ?? "https://fhir.kemkes.go.id/id/nik|9271060312000001";
  const practitionerIdentifier =
    env.SATUSEHAT_TEST_PRACTITIONER_IDENTIFIER ??
    "https://fhir.kemkes.go.id/id/nik|7209061211900001";

  console.log("Running SATUSEHAT sandbox read-only checks...");

  await check(
    "Organization.getById",
    () => client.organization.getById({ id: organizationId }),
    (organization) => `"${organization.name}"`,
  );
  await check(
    "Organization.search(partof)",
    () => client.organization.search({ partof: organizationId }),
    describeSearch,
  );
  await check(
    "Location.search(organization)",
    () => client.location.search({ organization: organizationId }),
    describeSearch,
  );
  await check(
    "Practitioner.search(identifier)",
    () => client.practitioner.search({ identifier: practitionerIdentifier }),
    describeSearch,
  );

  const patients = await check(
    "Patient.search(identifier)",
    () => client.patient.search({ identifier: patientIdentifier }),
    describeSearch,
  );
  const patientId = patients?.entry?.[0]?.resource.id;

  if (!patientId) {
    console.log("SKIP  Patient, Encounter, and Condition reads: no patient found");
    return;
  }

  await check(
    "Patient.getById",
    () => client.patient.getById({ id: patientId }),
    (patient) => `id=${patient.id}`,
  );
  await check(
    "Condition.search(subject)",
    () => client.condition.search({ subject: patientId }),
    describeSearch,
  );

  const encounters = await check(
    "Encounter.search(subject)",
    () => client.encounter.search({ subject: patientId }),
    describeSearch,
  );
  const encounterId = encounters?.entry?.[0]?.resource.id;

  if (!encounterId) {
    console.log("SKIP  Encounter.getById and Condition.search(encounter): no encounter found");
    return;
  }

  await check(
    "Encounter.getById",
    () => client.encounter.getById({ id: encounterId }),
    (encounter) => `status=${encounter.status}`,
  );
  await check(
    "Condition.search(encounter)",
    () => client.condition.search({ encounter: encounterId }),
    describeSearch,
  );
}

main()
  .then(() => {
    console.log(
      failedCount === 0
        ? "All sandbox checks passed."
        : `${failedCount} sandbox check(s) failed.`,
    );
    process.exitCode = failedCount === 0 ? 0 : 1;
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });

import { createEncounterQueueBuilder, createSatuSehatClientFromEnv } from "../src";
import {
  assertSandbox,
  DEFAULT_SANDBOX_PATIENT_IDENTIFIER,
  DEFAULT_SANDBOX_PRACTITIONER_IDENTIFIER,
  describeError,
  type SandboxEnv,
} from "./sandbox-env";

// Sends one outpatient (RAJAL) visit to the SATUSEHAT sandbox, the same way a SIMRS would:
// Encounter arrived -> in-progress -> Condition -> Observation -> Encounter finished.
// This CREATES data in the sandbox. SATUSEHAT has no DELETE, so the data stays there.

const env = process.env as SandboxEnv;
const client = createSatuSehatClientFromEnv(env);

async function step<T>(
  label: string,
  run: () => Promise<T>,
  describe: (result: NoInfer<T>) => string,
): Promise<T> {
  try {
    const result = await run();
    console.log(`PASS  ${label} -> ${describe(result)}`);
    return result;
  } catch (error) {
    console.log(`FAIL  ${label} -> ${describeError(error)}`);
    throw new Error(`Stopped at "${label}"`, { cause: error });
  }
}

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

async function main(): Promise<void> {
  const organizationId = assertSandbox(env);
  const patientIdentifier =
    env.SATUSEHAT_TEST_PATIENT_IDENTIFIER ?? DEFAULT_SANDBOX_PATIENT_IDENTIFIER;
  const practitionerIdentifier =
    env.SATUSEHAT_TEST_PRACTITIONER_IDENTIFIER ?? DEFAULT_SANDBOX_PRACTITIONER_IDENTIFIER;
  const registrationId = `SANDBOX-${Date.now()}`;

  console.log(`Sending a sandbox outpatient visit (registration ${registrationId})...`);

  const patient = await step(
    "Patient.search",
    async () => {
      const result = await client.patient.search({ identifier: patientIdentifier });
      const resource = result.entry?.[0]?.resource;
      if (!resource?.id) throw new Error("Sandbox patient not found");
      return { id: resource.id, name: resource.name?.[0]?.text };
    },
    (found) => `Patient/${found.id}`,
  );

  const practitioner = await step(
    "Practitioner.search",
    async () => {
      const result = await client.practitioner.search({ identifier: practitionerIdentifier });
      const resource = result.entry?.[0]?.resource;
      if (!resource?.id) throw new Error("Sandbox practitioner not found");
      return { id: resource.id, name: resource.name?.[0]?.text };
    },
    (found) => `Practitioner/${found.id}`,
  );

  const location = await step(
    "Location.search",
    async () => {
      const result = await client.location.search({ organization: organizationId });
      const resource = result.entry?.[0]?.resource;
      if (!resource?.id) throw new Error("No location registered for this organization");
      return { id: resource.id, name: resource.name };
    },
    (found) => `Location/${found.id}`,
  );

  const finishedAt = minutesAgo(1);
  const visit = createEncounterQueueBuilder({
    organizationId,
    registrationId,
    subject: {
      reference: `Patient/${patient.id}`,
      ...(patient.name ? { display: patient.name } : {}),
    },
    consultationMethod: "RAJAL",
    statusTimeline: {
      stages: [
        { status: "arrived", start: minutesAgo(30) },
        { status: "in-progress", start: minutesAgo(20) },
        { status: "finished", start: finishedAt },
      ],
      periodEnd: finishedAt,
    },
    location: {
      locationId: location.id,
      ...(location.name ? { display: location.name } : {}),
      status: "active",
    },
    participants: {
      practitionerId: practitioner.id,
      ...(practitioner.name ? { display: practitioner.name } : {}),
    },
    condition: {
      code: {
        coding: [
          {
            system: "http://hl7.org/fhir/sid/icd-10",
            code: "J06.9",
            display: "Acute upper respiratory infection, unspecified",
          },
        ],
      },
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
            system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
            code: "confirmed",
            display: "Confirmed",
          },
        ],
      },
    },
  });

  const encounter = await step(
    "Encounter.create (arrived)",
    () => client.encounter.create(visit.buildEncounterAtStage("arrived")),
    (created) => `Encounter/${created.id}, status=${created.status}`,
  );

  await step(
    "Encounter.update (in-progress)",
    () =>
      client.encounter.update({
        id: encounter.id,
        body: { ...visit.buildEncounterAtStage("in-progress"), id: encounter.id },
      }),
    (updated) => `status=${updated.status}`,
  );

  const condition = await step(
    "Condition.create",
    () => client.condition.create(visit.buildCondition(encounter.id)),
    (created) => `Condition/${created.id}`,
  );

  const observation = await step(
    "Observation.create (heart rate)",
    () =>
      client.observation.create({
        resourceType: "Observation",
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "vital-signs",
                display: "Vital Signs",
              },
            ],
          },
        ],
        code: {
          coding: [{ system: "http://loinc.org", code: "8867-4", display: "Heart rate" }],
        },
        subject: { reference: `Patient/${patient.id}` },
        performer: [{ reference: `Practitioner/${practitioner.id}` }],
        encounter: { reference: `Encounter/${encounter.id}` },
        effectiveDateTime: minutesAgo(15),
        issued: minutesAgo(15),
        valueQuantity: {
          value: 80,
          unit: "beats/minute",
          system: "http://unitsofmeasure.org",
          code: "/min",
        },
      }),
    (created) => `Observation/${created.id}`,
  );

  await step(
    "Encounter.update (finished + diagnosis)",
    () =>
      client.encounter.update({
        id: encounter.id,
        body: {
          ...visit.buildEncounterWithDiagnosis({ conditionId: condition.id }),
          id: encounter.id,
        },
      }),
    (updated) => `status=${updated.status}, diagnosis=${updated.diagnosis?.length ?? 0}`,
  );

  await step(
    "Encounter.getById (read back)",
    () => client.encounter.getById({ id: encounter.id }),
    (read) => `status=${read.status}, statusHistory=${read.statusHistory.length}`,
  );

  await step(
    "Condition.search (by encounter)",
    () => client.condition.search({ encounter: encounter.id }),
    (result) => `entries=${result.entry?.length ?? 0}`,
  );

  console.log("\nAll write steps passed. Created in the sandbox:");
  console.log(`  Encounter/${encounter.id} (registration ${registrationId})`);
  console.log(`  Condition/${condition.id}`);
  console.log(`  Observation/${observation.id}`);
}

main().catch((error: unknown) => {
  if (!(error instanceof Error && error.message.startsWith("Stopped at"))) {
    console.error(error);
  }
  process.exitCode = 1;
});

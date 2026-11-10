import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  createAnamnesisBuilder,
  createEmergencyTriageBuilder,
  createEncounterBuilder,
  createEncounterConditionBuilder,
  createEncounterDiagnosisUse,
  createEncounterIdentifier,
  createEncounterLocation,
  createEncounterParticipant,
  createEncounterServiceProviderReference,
  createPhysicalExamBuilder,
  createSatuSehatClientFromEnv,
  HL7_SERVICE_TYPE_SYSTEM,
  SNOMED_CT_SYSTEM,
  type ConditionCreateInput,
  type Encounter,
  type EncounterBuilder,
  type EncounterCreateInput,
  type EncounterDiagnosis,
  type EncounterServiceClassInput,
  type FetchLike,
} from "../src";
import {
  assertSandbox,
  DEFAULT_SANDBOX_PATIENT_IDENTIFIER,
  DEFAULT_SANDBOX_PRACTITIONER_IDENTIFIER,
  describeError,
  type SandboxEnv,
} from "./sandbox-env";

// Sends visits to the SATUSEHAT sandbox the way a SIMRS does in real time, then reads them back:
// - rajal: Encounter arrived -> in-progress -> pemeriksaan fisik, anamnesis -> Condition -> finished
// - igd:   Encounter arrived -> triase -> triaged -> in-progress -> pemeriksaan fisik, anamnesis
//          -> Condition -> finished
// - ranap: Encounter in-progress (kelas 2) -> naik kelas -> pemeriksaan fisik, anamnesis
//          -> Condition -> finished
// Anamnesis: keluhan utama, keluhan penyerta, riwayat penyakit pribadi (Condition), riwayat
// penyakit keluarga (FamilyMemberHistory), riwayat alergi, riwayat pengobatan.
// Usage: npm run smoke:sandbox:write -- [rajal|igd|ranap|all] [--log=<dir>]   (default: all)
// --log writes every request and response (except the OAuth token call) as JSON files to <dir>,
// with the Authorization header removed.
// This CREATES data in the sandbox. SATUSEHAT has no DELETE, so the data stays there.

const SCENARIOS = ["rajal", "igd", "ranap"] as const;
type Scenario = (typeof SCENARIOS)[number];

const args = process.argv.slice(2);
const logDir = args.find((arg) => arg.startsWith("--log="))?.slice("--log=".length);
const requestedScenario = args.find((arg) => !arg.startsWith("--")) ?? "all";

let logLabel = "setup";
let logSequence = 0;

function parseJson(text: string | undefined): unknown {
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// Records each SATUSEHAT call to <logDir>/NN-<scenario>-<METHOD>-<Resource>.json.
const loggingFetch: FetchLike = async (input, init) => {
  const response = await fetch(input, init);
  const url = String(input);

  if (logDir && !url.includes("/accesstoken")) {
    logSequence += 1;
    const method = init?.method ?? "GET";
    const resource = new URL(url).pathname.split("/").find((part) => /^[A-Z]/.test(part));
    const name = `${String(logSequence).padStart(2, "0")}-${logLabel}-${method}-${resource ?? "request"}.json`;
    const body = typeof init?.body === "string" ? init.body : undefined;

    await writeFile(
      join(logDir, name),
      JSON.stringify(
        {
          request: { method, url, body: parseJson(body) },
          response: { status: response.status, body: parseJson(await response.clone().text()) },
        },
        null,
        2,
      ) + "\n",
    );
  }

  return response;
};

const env = process.env as SandboxEnv;
const client = createSatuSehatClientFromEnv(env, { fetch: loggingFetch });

interface SandboxContext {
  organizationId: string;
  patient: { id: string; reference: string; display?: string };
  practitioner: { id: string; name?: string | undefined };
  locations: Array<{ id: string; name?: string | undefined }>;
}

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

function describeEncounter(encounter: Encounter): string {
  const location = encounter.location[encounter.location.length - 1];
  const serviceClass = location?.extension?.find((entry) => entry.url.endsWith("/ServiceClass"));
  const codes = (
    serviceClass?.extension as
      | Array<{
          valueCodeableConcept?: { coding?: Array<{ code?: string }> };
        }>
      | undefined
  )?.map((entry) => entry.valueCodeableConcept?.coding?.[0]?.code);
  const statuses = encounter.statusHistory.map((entry) => entry.status).join(">");
  const disposition = encounter.hospitalization?.dischargeDisposition?.coding?.[0]?.code;

  return [
    `status=${encounter.status}`,
    `class=${encounter.class.code}`,
    `history=${statuses}`,
    `locations=${encounter.location.length}`,
    `serviceClass=${codes?.join("/") ?? "-"}`,
    `diagnosis=${encounter.diagnosis?.length ?? 0}`,
    `dischargeDisposition=${disposition ?? "-"}`,
    `serviceType=${encounter.serviceType?.coding?.[0]?.code ?? "-"}`,
    `admitSource=${encounter.hospitalization?.admitSource?.coding?.[0]?.code ?? "-"}`,
    `extensions=${encounter.extension?.length ?? 0}`,
  ].join(", ");
}

function diagnosisCondition(
  context: SandboxContext,
  encounterId: string,
  icd10: { code: string; display: string },
): ConditionCreateInput {
  return createEncounterConditionBuilder({
    subject: { reference: context.patient.reference },
    encounter: { reference: `Encounter/${encounterId}` },
    condition: {
      code: { coding: [{ system: "http://hl7.org/fhir/sid/icd-10", ...icd10 }] },
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
  }).buildCondition();
}

/**
 * Pengiriman Data Anamnesis (same for Rawat Jalan, IGD, and Rawat Inap): keluhan utama, keluhan
 * penyerta, riwayat penyakit pribadi, riwayat penyakit keluarga, riwayat alergi, and riwayat
 * pengobatan. Returns the Encounter.diagnosis entry (use CC) for the keluhan utama.
 */
async function sendAnamnesis(
  label: string,
  context: SandboxContext,
  encounterId: string,
  chiefComplaint: { code: string; display: string },
): Promise<EncounterDiagnosis> {
  const anamnesis = createAnamnesisBuilder({
    subject: { reference: context.patient.reference },
    encounter: { reference: `Encounter/${encounterId}` },
    recorder: { reference: `Practitioner/${context.practitioner.id}` },
    recordedDate: minutesAgo(29),
  });

  const keluhanUtama = await step(
    `${label} Anamnesis keluhan utama (Condition)`,
    () =>
      client.condition.create(
        anamnesis.buildChiefComplaint({ code: chiefComplaint, onsetDateTime: minutesAgo(60 * 24) }),
      ),
    (created) => `Condition/${created.id}`,
  );
  await step(
    `${label} Anamnesis keluhan penyerta (Condition)`,
    () =>
      client.condition.create(
        anamnesis.buildAccompanyingComplaint({ code: { code: "25064002", display: "Headache" } }),
      ),
    (created) => `Condition/${created.id}`,
  );
  await step(
    `${label} Anamnesis riwayat penyakit pribadi (Condition)`,
    () =>
      client.condition.create(
        anamnesis.buildPersonalHistory({
          code: { code: "161501007", display: "History of hypertension" },
          clinicalStatus: "active",
        }),
      ),
    (created) => `Condition/${created.id}`,
  );
  // Riwayat penyakit keluarga belongs to the patient, not the visit: SATUSEHAT rejects a second
  // identical FamilyMemberHistory (RuleNumber 20002), so look it up before creating it.
  await step(
    `${label} Anamnesis riwayat penyakit keluarga (FamilyMemberHistory)`,
    async () => {
      const existing = await client.familyMemberHistory.search({ patient: context.patient.id });
      const found = existing.entry?.find((entry) =>
        entry.resource.condition?.some((condition) =>
          condition.code.coding.some((coding) => coding.code === "160303001"),
        ),
      )?.resource;

      if (found) {
        return { id: found.id, reused: true };
      }

      const created = await client.familyMemberHistory.create(
        anamnesis.buildFamilyHistory({
          conditions: [{ code: { code: "160303001", display: "FH: Diabetes mellitus" } }],
        }),
      );
      return { id: created.id, reused: false };
    },
    (result) =>
      `FamilyMemberHistory/${result.id}${result.reused ? " (sudah ada, dipakai ulang)" : ""}`,
  );
  await step(
    `${label} Anamnesis riwayat alergi (AllergyIntolerance)`,
    () =>
      client.allergyIntolerance.create(
        anamnesis.buildAllergy({
          category: ["food"],
          code: { code: "227493005", display: "Cashew nuts" },
          verificationStatus: "confirmed",
          // The sandbox rejects every coding system on reaction.manifestation (RuleNumber 11149),
          // so the manifestation is sent as text. Official code: 126485001 Urticaria (SNOMED CT).
          reaction: [{ manifestation: [{ text: "Urticaria (gatal-gatal)" }], severity: "mild" }],
        }),
      ),
    (created) => `AllergyIntolerance/${created.id}`,
  );
  await step(
    `${label} Anamnesis riwayat pengobatan (MedicationStatement)`,
    () =>
      client.medicationStatement.create(
        anamnesis.buildMedicationHistory({
          medication: { kfa: { code: "92001087", display: "Ampicillin Trihydrate 500 mg Tablet" } },
          status: "completed",
          category: "community",
          note: "Diminum 3x sehari selama 5 hari",
        }),
      ),
    (created) => `MedicationStatement/${created.id}`,
  );

  return anamnesis.buildChiefComplaintDiagnosis(keluhanUtama.id, 2);
}

function observationContext(
  context: SandboxContext,
  encounterId: string,
  effectiveDateTime: string,
) {
  return {
    subject: { reference: context.patient.reference },
    encounter: { reference: `Encounter/${encounterId}` },
    performer: { reference: `Practitioner/${context.practitioner.id}` },
    effectiveDateTime,
  };
}

/**
 * Pengiriman Data Hasil Pemeriksaan Fisik (same mapping for Rawat Jalan, Rawat Inap, and
 * Asesmen Awal IGD): tanda vital, antropometri, tingkat kesadaran, and head-to-toe findings.
 */
async function sendPhysicalExam(
  label: string,
  context: SandboxContext,
  encounterId: string,
  effectiveDateTime: string,
): Promise<void> {
  const exam = createPhysicalExamBuilder(
    observationContext(context, encounterId, effectiveDateTime),
  );
  const observations = [
    ...exam.buildMeasurements({
      "denyut-jantung": 80,
      pernapasan: 20,
      sistole: 120,
      diastole: 80,
      "suhu-tubuh": 36.8,
      "tinggi-badan": 165,
      "berat-badan": 60,
      "luas-permukaan-tubuh": 1.66,
    }),
    exam.buildConsciousness("248234008"),
    ...exam.buildHeadToToeExams({
      kepala: "Normocephal, tidak ada lesi",
      mata: "Konjungtiva tidak anemis, sklera tidak ikterik",
      tonsil: "T1-T1, tidak hiperemis",
      dada: "Simetris, vesikuler, tidak ada ronki dan wheezing",
      perut: "Supel, bising usus normal, tidak ada nyeri tekan",
    }),
  ];

  for (const observation of observations) {
    await step(
      `${label} Pemeriksaan fisik: ${observation.code.coding[0]?.display}`,
      () => client.observation.create(observation),
      (created) => `Observation/${created.id}`,
    );
  }
}

/** IGD: Pengiriman Data Triase dan Gawat Darurat. */
async function sendTriage(
  context: SandboxContext,
  encounterId: string,
  effectiveDateTime: string,
): Promise<void> {
  const triage = createEmergencyTriageBuilder(
    observationContext(context, encounterId, effectiveDateTime),
  );
  const observations = [
    triage.buildArrivalTransport("ambulans"),
    triage.buildReferralLetter(false),
    triage.buildTriageLevel("urgent"),
  ];

  for (const observation of observations) {
    await step(
      `[IGD] Triase: ${observation.code.coding[0]?.display}`,
      () => client.observation.create(observation),
      (created) => `Observation/${created.id}`,
    );
  }
}

async function sendVisit(
  label: string,
  builder: EncounterBuilder,
  steps: Array<{ name: string; apply: (encounterId: string) => Promise<void> | void }>,
): Promise<string> {
  const created = await step(
    `${label} Encounter.create (${builder.build().status})`,
    () => client.encounter.create(builder.build()),
    (encounter) => `Encounter/${encounter.id}`,
  );

  for (const { name, apply } of steps) {
    await apply(created.id);
    await step(
      `${label} Encounter.update (${name})`,
      () =>
        client.encounter.update({
          id: created.id,
          body: { ...builder.build(), id: created.id },
        }),
      (encounter) => `status=${encounter.status}`,
    );
  }

  await step(
    `${label} Encounter.getById (read back)`,
    () => client.encounter.getById({ id: created.id }),
    describeEncounter,
  );

  return created.id;
}

function startEncounter(
  context: SandboxContext,
  input: {
    preset: "outpatient" | "emergency" | "inpatient";
    status: "arrived" | "in-progress";
    start: string;
    location: SandboxContext["locations"][number];
    serviceClass: EncounterServiceClassInput;
    serviceType: NonNullable<EncounterCreateInput["serviceType"]>;
  },
): EncounterBuilder {
  return createEncounterBuilder({
    preset: input.preset,
    identifier: createEncounterIdentifier(
      context.organizationId,
      `SANDBOX-${input.preset.toUpperCase()}-${Date.now()}`,
    ),
    status: input.status,
    period: { start: input.start },
    subject: context.patient,
    serviceType: input.serviceType,
    participant: [
      {
        ...createEncounterParticipant({
          practitionerId: context.practitioner.id,
          ...(context.practitioner.name ? { display: context.practitioner.name } : {}),
        }),
        period: { start: input.start },
      },
    ],
    location: createEncounterLocation({
      locationId: input.location.id,
      ...(input.location.name ? { display: input.location.name } : {}),
      status: "active",
      period: { start: input.start },
      serviceClass: input.serviceClass,
    }),
    serviceProvider: createEncounterServiceProviderReference(context.organizationId),
  });
}

async function runRajal(context: SandboxContext): Promise<string> {
  const builder = startEncounter(context, {
    preset: "outpatient",
    status: "arrived",
    start: minutesAgo(40),
    location: context.locations[0]!,
    serviceClass: { careSetting: "outpatient", serviceClass: "reguler" },
    serviceType: {
      coding: [{ system: HL7_SERVICE_TYPE_SYSTEM, code: "124", display: "General Practice" }],
    },
  }).setNovelty({ facility: "returning", specialty: "new", episode: "new" });

  return sendVisit("[RAJAL]", builder, [
    { name: "in-progress", apply: () => void builder.advanceStatus("in-progress", minutesAgo(30)) },
    {
      name: "finished + diagnosis + pulang",
      apply: async (encounterId) => {
        await sendPhysicalExam("[RAJAL]", context, encounterId, minutesAgo(28));
        const chiefComplaint = await sendAnamnesis("[RAJAL]", context, encounterId, {
          code: "49727002",
          display: "Cough",
        });
        const condition = await step(
          "[RAJAL] Condition.create",
          () =>
            client.condition.create(
              diagnosisCondition(context, encounterId, {
                code: "J06.9",
                display: "Acute upper respiratory infection, unspecified",
              }),
            ),
          (created) => `Condition/${created.id}`,
        );
        builder
          .addDiagnosisByCondition(condition.id)
          .addDiagnosis(chiefComplaint)
          .setInpatientHospitalization({ dischargeDisposition: "home" })
          .finish(minutesAgo(20));
      },
    },
  ]);
}

async function runIgd(context: SandboxContext): Promise<string> {
  const builder = startEncounter(context, {
    preset: "emergency",
    status: "arrived",
    start: minutesAgo(60),
    location: context.locations[0]!,
    serviceClass: { careSetting: "outpatient", serviceClass: "reguler" },
    serviceType: {
      coding: [{ system: HL7_SERVICE_TYPE_SYSTEM, code: "117", display: "Emergency Medical" }],
    },
  });

  return sendVisit("[IGD]", builder, [
    {
      name: "triaged",
      apply: async (encounterId) => {
        await sendTriage(context, encounterId, minutesAgo(56));
        builder.advanceStatus("triaged", minutesAgo(55));
      },
    },
    { name: "in-progress", apply: () => void builder.advanceStatus("in-progress", minutesAgo(50)) },
    {
      name: "finished + diagnosis + pulang",
      apply: async (encounterId) => {
        await sendPhysicalExam("[IGD]", context, encounterId, minutesAgo(52));
        const chiefComplaint = await sendAnamnesis("[IGD]", context, encounterId, {
          code: "386661006",
          display: "Fever",
        });
        const condition = await step(
          "[IGD] Condition.create",
          () =>
            client.condition.create(
              diagnosisCondition(context, encounterId, {
                code: "R50.9",
                display: "Fever, unspecified",
              }),
            ),
          (created) => `Condition/${created.id}`,
        );
        builder
          .addDiagnosisByCondition(condition.id)
          .addDiagnosis(chiefComplaint)
          .setInpatientHospitalization({ dischargeDisposition: "home" })
          .finish(minutesAgo(15));
      },
    },
  ]);
}

async function runRanap(context: SandboxContext): Promise<string> {
  const room = context.locations[1] ?? context.locations[0]!;
  const builder = startEncounter(context, {
    preset: "inpatient",
    status: "in-progress",
    start: minutesAgo(180),
    location: context.locations[0]!,
    serviceClass: { careSetting: "inpatient", serviceClass: "2" },
    serviceType: {
      coding: [
        { system: SNOMED_CT_SYSTEM, code: "792848000", display: "Internal medicine service" },
      ],
    },
  }).setInpatientHospitalization({ admitSource: "outp" });

  return sendVisit("[RANAP]", builder, [
    {
      name: "naik kelas 2 -> 1",
      apply: () =>
        void builder.moveToLocation(
          {
            locationId: room.id,
            ...(room.name ? { display: room.name } : {}),
            serviceClass: {
              careSetting: "inpatient",
              serviceClass: "1",
              upgradeClass: "naik-kelas",
            },
          },
          minutesAgo(120),
        ),
    },
    {
      name: "finished + diagnosis + pulang",
      apply: async (encounterId) => {
        await sendPhysicalExam("[RANAP]", context, encounterId, minutesAgo(170));
        const chiefComplaint = await sendAnamnesis("[RANAP]", context, encounterId, {
          code: "62315008",
          display: "Diarrhea",
        });
        const condition = await step(
          "[RANAP] Condition.create",
          () =>
            client.condition.create(
              diagnosisCondition(context, encounterId, {
                code: "A09",
                display: "Diarrhoea and gastroenteritis of presumed infectious origin",
              }),
            ),
          (created) => `Condition/${created.id}`,
        );
        builder
          .addDiagnosisByCondition(condition.id, { use: createEncounterDiagnosisUse("DD") })
          .addDiagnosis(chiefComplaint)
          .setInpatientHospitalization({ admitSource: "outp", dischargeDisposition: "home" })
          .finish(minutesAgo(10));
      },
    },
  ]);
}

async function resolveContext(): Promise<SandboxContext> {
  const organizationId = assertSandbox(env);
  const patientIdentifier =
    env.SATUSEHAT_TEST_PATIENT_IDENTIFIER ?? DEFAULT_SANDBOX_PATIENT_IDENTIFIER;
  const practitionerIdentifier =
    env.SATUSEHAT_TEST_PRACTITIONER_IDENTIFIER ?? DEFAULT_SANDBOX_PRACTITIONER_IDENTIFIER;

  const patient = await step(
    "Patient.search",
    async () => {
      const resource = (await client.patient.search({ identifier: patientIdentifier })).entry?.[0]
        ?.resource;
      if (!resource?.id) throw new Error("Sandbox patient not found");
      const name = resource.name?.[0]?.text;
      return {
        id: resource.id,
        reference: `Patient/${resource.id}`,
        ...(name ? { display: name } : {}),
      };
    },
    (found) => found.reference,
  );
  const practitioner = await step(
    "Practitioner.search",
    async () => {
      const resource = (await client.practitioner.search({ identifier: practitionerIdentifier }))
        .entry?.[0]?.resource;
      if (!resource?.id) throw new Error("Sandbox practitioner not found");
      return { id: resource.id, name: resource.name?.[0]?.text };
    },
    (found) => `Practitioner/${found.id}`,
  );
  const locations = await step(
    "Location.search",
    async () => {
      const entries = (await client.location.search({ organization: organizationId })).entry ?? [];
      const found = entries
        .slice(0, 2)
        .map(({ resource }) => ({ id: resource.id, name: resource.name }));
      if (found.length === 0) throw new Error("No location registered for this organization");
      return found;
    },
    (found) => found.map((location) => `Location/${location.id}`).join(", "),
  );

  return { organizationId, patient, practitioner, locations };
}

async function main(): Promise<void> {
  const scenarios: Scenario[] =
    requestedScenario === "all"
      ? [...SCENARIOS]
      : SCENARIOS.filter((scenario) => scenario === requestedScenario);

  if (scenarios.length === 0) {
    throw new Error(
      `Unknown scenario "${requestedScenario}". Use one of: ${SCENARIOS.join(", ")}, all`,
    );
  }

  if (logDir) {
    await mkdir(logDir, { recursive: true });
  }

  const context = await resolveContext();
  const runners = { rajal: runRajal, igd: runIgd, ranap: runRanap } satisfies Record<
    Scenario,
    (context: SandboxContext) => Promise<string>
  >;
  const created: string[] = [];

  for (const scenario of scenarios) {
    logLabel = scenario;
    console.log(`\n== ${scenario.toUpperCase()} ==`);
    created.push(`${scenario}: Encounter/${await runners[scenario](context)}`);
  }

  console.log("\nAll write steps passed. Created in the sandbox:");
  created.forEach((line) => console.log(`  ${line}`));

  if (logDir) {
    console.log(`\nRequests and responses written to ${logDir}`);
  }
}

main().catch((error: unknown) => {
  if (!(error instanceof Error && error.message.startsWith("Stopped at"))) {
    console.error(error);
  }
  process.exitCode = 1;
});

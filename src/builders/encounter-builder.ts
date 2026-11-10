import {
  ENCOUNTER_ADMIT_SOURCES,
  ENCOUNTER_CLASSES,
  ENCOUNTER_DIAGNOSIS_USES,
  ENCOUNTER_DISCHARGE_DISPOSITIONS,
  ENCOUNTER_INPATIENT_SERVICE_CLASSES,
  ENCOUNTER_NOVELTY_CODES,
  ENCOUNTER_NOVELTY_EXTENSION_URLS,
  ENCOUNTER_OUTPATIENT_SERVICE_CLASSES,
  ENCOUNTER_SERVICE_CLASS_EXTENSION_URL,
  ENCOUNTER_UPGRADE_CLASSES,
  HL7_ADMIT_SOURCE_SYSTEM,
  HL7_DISCHARGE_DISPOSITION_SYSTEM,
  type EncounterAdmitSourceCode,
  type EncounterClassCode,
  type EncounterDiagnosisUseCode,
  type EncounterDischargeDispositionCode,
  type EncounterInpatientServiceClass,
  type EncounterNoveltyCode,
  type EncounterNoveltyKind,
  type EncounterOutpatientServiceClass,
  type EncounterUpgradeClass,
} from "../schemas/encounter-terminology";
import {
  EncounterClassSchema,
  EncounterAdmitSourceSchema,
  EncounterCreateSchema,
  EncounterDischargeDispositionSchema,
  EncounterHospitalizationSchema,
  EncounterIdentifierSchema,
  EncounterLocationSchema,
  EncounterLocationServiceClassExtensionSchema,
  EncounterParticipantSchema,
} from "../schemas/encounter";
import { ReferenceSchema } from "../schemas/common";
import { createEncounterDiagnosis } from "./encounter-condition-builder";
import type { Reference } from "../schemas/common";
import type {
  EncounterAdmitSource,
  EncounterClass,
  EncounterClassHistory,
  EncounterCreateInput,
  EncounterDischargeDisposition,
  EncounterDiagnosis,
  EncounterExtension,
  EncounterHospitalization,
  EncounterIdentifier,
  EncounterLocation,
  EncounterLocationServiceClassExtension,
  EncounterParticipant,
  EncounterPeriod,
  EncounterStatus,
  EncounterStatusHistory,
} from "../schemas/encounter";

/**
 * Service class (kelas perawatan) of an Encounter location. Rawat jalan and IGD use "reguler" or
 * "eksekutif"; rawat inap uses "1", "2", "3", "vip", "vvip", or KRIS ("kris-a", "kris-b",
 * "kris-c"). `upgradeClass` defaults to "kelas-tetap".
 */
export type EncounterServiceClassInput =
  | {
      careSetting: "outpatient";
      serviceClass: EncounterOutpatientServiceClass;
      upgradeClass?: EncounterUpgradeClass;
    }
  | {
      careSetting: "inpatient";
      serviceClass: EncounterInpatientServiceClass;
      upgradeClass?: EncounterUpgradeClass;
    };

/** Encounter.class coding for an official class code (section 3.4). */
export function createEncounterClass(code: EncounterClassCode): EncounterClass {
  const { system, display } = ENCOUNTER_CLASSES[code];
  return { system, code, display };
}

const ENCOUNTER_CLASS_PRESETS = {
  outpatient: createEncounterClass("AMB"),
  inpatient: createEncounterClass("IMP"),
  emergency: createEncounterClass("EMER"),
} satisfies Record<string, EncounterClass>;

type EncounterBuilderCommonInput = {
  identifier: EncounterIdentifier | EncounterIdentifier[];
  status: EncounterStatus;
  statusHistory?: EncounterStatusHistory[];
  classHistory?: EncounterClassHistory[];
  type?: NonNullable<EncounterCreateInput["type"]>;
  serviceType?: EncounterCreateInput["serviceType"];
  priority?: EncounterCreateInput["priority"];
  subject: Reference;
  episodeOfCare?: Reference[];
  basedOn?: Reference[];
  participant?: EncounterParticipant[];
  period: EncounterCreateInput["period"];
  length?: EncounterCreateInput["length"];
  reasonCode?:
    | NonNullable<EncounterCreateInput["reasonCode"]>[number]
    | NonNullable<EncounterCreateInput["reasonCode"]>
    | undefined;
  reasonReference?: Reference[];
  diagnosis?: EncounterDiagnosis | EncounterDiagnosis[] | undefined;
  account?: Reference[];
  hospitalization?: EncounterHospitalization;
  location: EncounterLocation | EncounterLocation[];
  serviceProvider: Reference;
  partOf?: Reference;
  extension?: EncounterExtension[];
};

type EncounterBuilderPresetInput = EncounterBuilderCommonInput & {
  preset: keyof typeof ENCOUNTER_CLASS_PRESETS;
  encounterClass?: never;
};

type EncounterBuilderCustomClassInput = EncounterBuilderCommonInput & {
  preset?: never;
  encounterClass: EncounterClass;
};

export type EncounterBuilderPreset = keyof typeof ENCOUNTER_CLASS_PRESETS;
export type EncounterBuilderInput =
  | EncounterBuilderPresetInput
  | EncounterBuilderCustomClassInput;

export type EncounterHospitalizationHelperInput = Omit<
  EncounterHospitalization,
  "admitSource" | "dischargeDisposition"
> & {
  admitSource?: EncounterAdmitSource | EncounterAdmitSourceCode;
  dischargeDisposition?: EncounterDischargeDisposition | EncounterDischargeDispositionCode;
};

export interface EmergencyEncounterStatusStageInput {
  status: EncounterStatus;
  start: string;
}

export type EmergencyEncounterClassStageInput =
  | {
      start: string;
      preset: EncounterBuilderPreset;
      encounterClass?: never;
    }
  | {
      start: string;
      preset?: never;
      encounterClass: EncounterClass;
    };

export interface EmergencyEncounterHistoryInput {
  statusStages: [
    EmergencyEncounterStatusStageInput,
    ...EmergencyEncounterStatusStageInput[],
  ];
  /** Omit while the encounter is still ongoing; the last stage then stays open. */
  periodEnd?: string;
  classStages?: [
    EmergencyEncounterClassStageInput,
    ...EmergencyEncounterClassStageInput[],
  ];
}

export interface EmergencyEncounterHistoryResult {
  status: EncounterStatus;
  period: EncounterCreateInput["period"];
  encounterClass: EncounterClass;
  statusHistory: EncounterStatusHistory[];
  classHistory: EncounterClassHistory[];
}

export type EncounterConsultationMethod =
  | "RAJAL"
  | "IGD"
  | "RANAP"
  | "HOMECARE"
  | "TELEKONSULTASI";

export interface EncounterParticipantHelperInput {
  practitionerId: string;
  display?: string;
  typeCode?: string;
  typeDisplay?: string;
  typeText?: string;
}

export interface EncounterLocationHelperInput {
  locationId: string;
  display?: string;
  status?: EncounterLocation["status"];
  period?: EncounterLocation["period"];
  physicalType?: EncounterLocation["physicalType"];
  extension?: EncounterLocation["extension"];
  serviceClass?: EncounterServiceClassInput;
}

export interface EncounterStatusTimelineStageInput {
  status: EncounterStatus;
  start: string;
}

export interface EncounterStatusTimelineInput {
  stages: [
    EncounterStatusTimelineStageInput,
    ...EncounterStatusTimelineStageInput[],
  ];
  /** Omit while the encounter is still ongoing; the last stage then stays open. */
  periodEnd?: string;
}

export interface EncounterStatusTimelineResult {
  status: EncounterStatus;
  period: EncounterCreateInput["period"];
  statusHistory: EncounterStatusHistory[];
}

function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

function cloneEncounterClass(value: EncounterClass): EncounterClass {
  return { ...value };
}

function parseIsoDateTime(value: string, label: string): number {
  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    throw new TypeError(`${label} must be a valid ISO date-time string`);
  }

  return timestamp;
}

function createPeriod(start: string, end: string | undefined): EncounterPeriod {
  return end ? { start, end } : { start };
}

function closePeriod<TEntry extends { period: EncounterPeriod }>(
  entry: TEntry,
  end: string,
): TEntry {
  return entry.period.end ? entry : { ...entry, period: { ...entry.period, end } };
}

function assertAscendingTimeline(
  label: string,
  starts: { start: string }[],
  periodEnd: string | undefined,
): void {
  const endTimestamp =
    periodEnd === undefined ? undefined : parseIsoDateTime(periodEnd, `${label} periodEnd`);

  let previousTimestamp: number | undefined;

  starts.forEach((entry, index) => {
    const currentTimestamp = parseIsoDateTime(
      entry.start,
      `${label} stage ${index + 1} start`,
    );

    if (previousTimestamp !== undefined && currentTimestamp <= previousTimestamp) {
      throw new RangeError(`${label} stages must be sorted in strictly ascending order`);
    }

    if (endTimestamp !== undefined && currentTimestamp >= endTimestamp) {
      throw new RangeError(`${label} stage ${index + 1} must start before periodEnd`);
    }

    previousTimestamp = currentTimestamp;
  });
}

function resolveEncounterClass(input: EncounterBuilderInput): EncounterClass {
  if ("encounterClass" in input && input.encounterClass) {
    return cloneEncounterClass(input.encounterClass);
  }

  return cloneEncounterClass(ENCOUNTER_CLASS_PRESETS[input.preset]);
}

function resolveEncounterClassStage(
  input: EmergencyEncounterClassStageInput,
): EncounterClass {
  if ("encounterClass" in input && input.encounterClass) {
    return cloneEncounterClass(input.encounterClass);
  }

  return cloneEncounterClass(ENCOUNTER_CLASS_PRESETS[input.preset]);
}

function createStatusHistoryFromStages(
  stages:
    | EmergencyEncounterHistoryInput["statusStages"]
    | EncounterStatusTimelineInput["stages"],
  periodEnd: string | undefined,
): EncounterStatusHistory[] {
  return stages.map((stage, index) => ({
    status: stage.status,
    period: createPeriod(stage.start, stages[index + 1]?.start ?? periodEnd),
  }));
}

function createClassHistoryFromStages(
  stages: [
    EmergencyEncounterClassStageInput,
    ...EmergencyEncounterClassStageInput[],
  ],
  periodEnd: string | undefined,
): EncounterClassHistory[] {
  return stages.map((stage, index) => ({
    class: resolveEncounterClassStage(stage),
    period: createPeriod(stage.start, stages[index + 1]?.start ?? periodEnd),
  }));
}

function normalizeAdmitSource(
  admitSource: EncounterHospitalizationHelperInput["admitSource"],
): EncounterAdmitSource | undefined {
  if (!admitSource) {
    return undefined;
  }

  if (typeof admitSource === "string") {
    if (Object.hasOwn(ENCOUNTER_ADMIT_SOURCES, admitSource)) {
      return createEncounterAdmitSource(admitSource);
    }

    return EncounterAdmitSourceSchema.parse({
      coding: [{ system: HL7_ADMIT_SOURCE_SYSTEM, code: admitSource }],
    });
  }

  return EncounterAdmitSourceSchema.parse(admitSource);
}

function normalizeDischargeDisposition(
  dischargeDisposition: EncounterHospitalizationHelperInput["dischargeDisposition"],
): EncounterDischargeDisposition | undefined {
  if (!dischargeDisposition) {
    return undefined;
  }

  if (typeof dischargeDisposition === "string") {
    if (Object.hasOwn(ENCOUNTER_DISCHARGE_DISPOSITIONS, dischargeDisposition)) {
      return createEncounterDischargeDisposition(
        dischargeDisposition as EncounterDischargeDispositionCode,
      );
    }

    return EncounterDischargeDispositionSchema.parse({
      coding: [{ system: HL7_DISCHARGE_DISPOSITION_SYSTEM, code: dischargeDisposition }],
    });
  }

  return EncounterDischargeDispositionSchema.parse(dischargeDisposition);
}

/**
 * Builds Encounter.hospitalization.dischargeDisposition from a SATUSEHAT code.
 * Use `text` for free text, for example with "oth" (lain-lain).
 */
export function createEncounterDischargeDisposition(
  code: EncounterDischargeDispositionCode,
  text?: string,
): EncounterDischargeDisposition {
  const { system, display } = ENCOUNTER_DISCHARGE_DISPOSITIONS[code];

  return EncounterDischargeDispositionSchema.parse({
    coding: [{ system, code, display }],
    ...(text ? { text } : {}),
  });
}

/** Builds Encounter.hospitalization.admitSource from a SATUSEHAT code (section 3.9). */
export function createEncounterAdmitSource(
  code: EncounterAdmitSourceCode,
  text?: string,
): EncounterAdmitSource {
  const { system, display } = ENCOUNTER_ADMIT_SOURCES[code];

  return EncounterAdmitSourceSchema.parse({
    coding: [{ system, code, display }],
    ...(text ? { text } : {}),
  });
}

/** Builds Encounter.diagnosis.use from a diagnosis role code (section 3.18). */
export function createEncounterDiagnosisUse(
  code: EncounterDiagnosisUseCode,
): EncounterDiagnosis["use"] {
  const { system, display } = ENCOUNTER_DIAGNOSIS_USES[code];
  return { coding: [{ system, code, display }] };
}

/**
 * Builds a SIRS Online status extension (section 3.22-3.24): Status Pengunjung ("facility"),
 * Status Kunjungan Spesialisasi ("specialty"), or Status Episode Pelayanan ("episode").
 * The extension URLs are not published by Kemenkes yet; see ENCOUNTER_NOVELTY_EXTENSION_URLS.
 */
export function createEncounterNoveltyExtension(
  kind: EncounterNoveltyKind,
  code: EncounterNoveltyCode,
): EncounterExtension {
  if (!Object.hasOwn(ENCOUNTER_NOVELTY_CODES, code)) {
    throw new RangeError(`Unknown encounter novelty code "${code}"`);
  }

  return { url: ENCOUNTER_NOVELTY_EXTENSION_URLS[kind], valueCode: code };
}

export function createEncounterIdentifier(
  organizationId: string,
  registrationId: string,
  use: EncounterIdentifier["use"] = "official",
): EncounterIdentifier {
  return EncounterIdentifierSchema.parse({
    system: `http://sys-ids.kemkes.go.id/encounter/${organizationId}`,
    use,
    value: registrationId,
  });
}

export function createEncounterServiceProviderReference(
  organizationId: string,
  display?: string,
): Reference {
  return ReferenceSchema.parse({
    reference: `Organization/${organizationId}`,
    ...(display ? { display } : {}),
  });
}

export function createEncounterParticipant(
  input: EncounterParticipantHelperInput,
): EncounterParticipant {
  return EncounterParticipantSchema.parse({
    type: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
            code: input.typeCode ?? "ATND",
            display: input.typeDisplay ?? "attender",
          },
        ],
        ...(input.typeText ? { text: input.typeText } : {}),
      },
    ],
    individual: {
      reference: `Practitioner/${input.practitionerId}`,
      ...(input.display ? { display: input.display } : {}),
    },
  });
}

export function createEncounterLocation(
  input: EncounterLocationHelperInput,
): EncounterLocation {
  return EncounterLocationSchema.parse({
    location: {
      reference: `Location/${input.locationId}`,
      ...(input.display ? { display: input.display } : {}),
    },
    ...(input.status ? { status: input.status } : {}),
    ...(input.period ? { period: input.period } : {}),
    ...(input.physicalType ? { physicalType: input.physicalType } : {}),
    ...(input.extension || input.serviceClass
      ? {
          extension: [
            ...(input.extension ?? []),
            ...(input.serviceClass
              ? [createEncounterLocationServiceClassExtension(input.serviceClass)]
              : []),
          ],
        }
      : {}),
  });
}

export function createEncounterClassFromConsultationMethod(
  method: EncounterConsultationMethod,
): EncounterClass {
  const encounterClassByMethod = {
    RAJAL: ENCOUNTER_CLASS_PRESETS.outpatient,
    IGD: ENCOUNTER_CLASS_PRESETS.emergency,
    RANAP: ENCOUNTER_CLASS_PRESETS.inpatient,
    HOMECARE: createEncounterClass("HH"),
    TELEKONSULTASI: createEncounterClass("VR"),
  } satisfies Record<EncounterConsultationMethod, EncounterClass>;

  return EncounterClassSchema.parse(encounterClassByMethod[method]);
}

export function createEncounterHospitalization(
  input: EncounterHospitalizationHelperInput,
): EncounterHospitalization {
  const hospitalization = {
    ...input,
    ...(input.admitSource ? { admitSource: normalizeAdmitSource(input.admitSource) } : {}),
    ...(input.dischargeDisposition
      ? {
          dischargeDisposition: normalizeDischargeDisposition(input.dischargeDisposition),
        }
      : {}),
  };

  return EncounterHospitalizationSchema.parse(hospitalization);
}

export function createEmergencyEncounterHistory(
  input: EmergencyEncounterHistoryInput,
): EmergencyEncounterHistoryResult {
  const [firstStatusStage] = input.statusStages;

  if (firstStatusStage.status !== "arrived") {
    throw new RangeError("Emergency encounter flow must start with status 'arrived'");
  }

  assertAscendingTimeline("Emergency encounter status", input.statusStages, input.periodEnd);

  const classStages = input.classStages ?? [
    {
      start: firstStatusStage.start,
      preset: "emergency",
    },
  ];

  assertAscendingTimeline("Emergency encounter class", classStages, input.periodEnd);

  if (classStages[0]?.start !== firstStatusStage.start) {
    throw new RangeError(
      "Emergency encounter class timeline must start at the same time as the first status stage",
    );
  }

  const statusHistory = createStatusHistoryFromStages(input.statusStages, input.periodEnd);
  const classHistory = createClassHistoryFromStages(classStages, input.periodEnd);
  const lastStatusStage = input.statusStages[input.statusStages.length - 1]!;
  const lastClassStage = classStages[classStages.length - 1]!;

  return {
    status: lastStatusStage.status,
    period: createPeriod(firstStatusStage.start, input.periodEnd),
    encounterClass: resolveEncounterClassStage(lastClassStage),
    statusHistory,
    classHistory,
  };
}

export function createEncounterStatusTimeline(
  input: EncounterStatusTimelineInput,
): EncounterStatusTimelineResult {
  const endTimestamp =
    input.periodEnd === undefined
      ? undefined
      : parseIsoDateTime(input.periodEnd, "Encounter status periodEnd");
  let previousTimestamp: number | undefined;

  input.stages.forEach((stage, index) => {
    const currentTimestamp = parseIsoDateTime(
      stage.start,
      `Encounter status stage ${index + 1} start`,
    );

    if (previousTimestamp !== undefined && currentTimestamp <= previousTimestamp) {
      throw new RangeError("Encounter status stages must be sorted in strictly ascending order");
    }

    if (endTimestamp !== undefined && currentTimestamp > endTimestamp) {
      throw new RangeError(`Encounter status stage ${index + 1} must start on or before periodEnd`);
    }

    previousTimestamp = currentTimestamp;
  });

  const statusHistory = createStatusHistoryFromStages(input.stages, input.periodEnd);
  const firstStage = input.stages[0];
  const lastStage = input.stages[input.stages.length - 1]!;

  return {
    status: lastStage.status,
    period: createPeriod(firstStage.start, input.periodEnd),
    statusHistory,
  };
}

/**
 * Builds the SATUSEHAT ServiceClass extension for Encounter.location: the service class
 * (kelas perawatan) and the class change indicator (kelas tetap, naik, turun, titip rawat).
 */
export function createEncounterLocationServiceClassExtension(
  input: EncounterServiceClassInput,
): EncounterLocationServiceClassExtension {
  const serviceClass =
    input.careSetting === "outpatient"
      ? { code: input.serviceClass, ...ENCOUNTER_OUTPATIENT_SERVICE_CLASSES[input.serviceClass] }
      : { code: input.serviceClass, ...ENCOUNTER_INPATIENT_SERVICE_CLASSES[input.serviceClass] };
  const upgradeClass = input.upgradeClass ?? "kelas-tetap";

  return EncounterLocationServiceClassExtensionSchema.parse({
    url: ENCOUNTER_SERVICE_CLASS_EXTENSION_URL,
    extension: [
      { url: "value", valueCodeableConcept: { coding: [serviceClass] } },
      {
        url: "upgradeClassIndicator",
        valueCodeableConcept: {
          coding: [{ code: upgradeClass, ...ENCOUNTER_UPGRADE_CLASSES[upgradeClass] }],
        },
      },
    ],
  });
}

function isServiceClassExtension(extension: { url: string }): boolean {
  return extension.url.toLowerCase() === ENCOUNTER_SERVICE_CLASS_EXTENSION_URL.toLowerCase();
}

/** Returns the location with its ServiceClass extension replaced (or added). */
export function withEncounterLocationServiceClass(
  location: EncounterLocation,
  input: EncounterServiceClassInput,
): EncounterLocation {
  return EncounterLocationSchema.parse({
    ...location,
    extension: [
      ...(location.extension ?? []).filter((entry) => !isServiceClassExtension(entry)),
      createEncounterLocationServiceClassExtension(input),
    ],
  });
}

/**
 * Moves the patient to another location (pindah ruang, naik/turun kelas): every location that is
 * still open gets `period.end = at` and status "completed", then `next` is appended as the
 * active location starting at `at`.
 */
export function moveEncounterLocation(
  locations: EncounterLocation[],
  next: EncounterLocation | EncounterLocationHelperInput,
  at: string,
): EncounterLocation[] {
  parseIsoDateTime(at, "Encounter location move time");

  const closed = locations.map((location) =>
    location.period?.end
      ? location
      : EncounterLocationSchema.parse({
          ...location,
          status: "completed",
          period: { ...location.period, end: at },
        }),
  );
  const nextLocation = "locationId" in next ? createEncounterLocation(next) : next;

  return [
    ...closed,
    EncounterLocationSchema.parse({
      ...nextLocation,
      status: "active",
      period: { start: at },
    }),
  ];
}

export class EncounterBuilder {
  private draft: EncounterCreateInput;

  public constructor(input: EncounterBuilderInput) {
    const encounterClass = resolveEncounterClass(input);

    this.draft = EncounterCreateSchema.parse({
      resourceType: "Encounter",
      identifier: toArray(input.identifier),
      status: input.status,
      statusHistory: input.statusHistory ?? [
        {
          status: input.status,
          period: input.period,
        },
      ],
      class: encounterClass,
      classHistory: input.classHistory ?? [
        {
          class: encounterClass,
          period: input.period,
        },
      ],
      ...(input.type ? { type: input.type } : {}),
      ...(input.serviceType ? { serviceType: input.serviceType } : {}),
      ...(input.priority ? { priority: input.priority } : {}),
      subject: input.subject,
      ...(input.episodeOfCare ? { episodeOfCare: input.episodeOfCare } : {}),
      ...(input.basedOn ? { basedOn: input.basedOn } : {}),
      ...(input.participant ? { participant: input.participant } : {}),
      period: input.period,
      ...(input.length ? { length: input.length } : {}),
      ...(input.reasonCode ? { reasonCode: toArray(input.reasonCode) } : {}),
      ...(input.reasonReference ? { reasonReference: input.reasonReference } : {}),
      ...(input.diagnosis ? { diagnosis: toArray(input.diagnosis) } : {}),
      ...(input.account ? { account: input.account } : {}),
      ...(input.hospitalization ? { hospitalization: input.hospitalization } : {}),
      location: toArray(input.location),
      serviceProvider: input.serviceProvider,
      ...(input.partOf ? { partOf: input.partOf } : {}),
      ...(input.extension ? { extension: input.extension } : {}),
    });
  }

  public addAccount(reference: Reference): this {
    this.draft.account = [...(this.draft.account ?? []), reference];
    return this;
  }

  public addBasedOn(reference: Reference): this {
    this.draft.basedOn = [...(this.draft.basedOn ?? []), reference];
    return this;
  }

  public addDiagnosis(diagnosis: EncounterDiagnosis): this {
    this.draft.diagnosis = [...(this.draft.diagnosis ?? []), diagnosis];
    return this;
  }

  public addDiagnosisByCondition(
    conditionId: string,
    options?: {
      display?: string;
      use?: EncounterDiagnosis["use"];
      rank?: number;
    },
  ): this {
    return this.addDiagnosis(
      createEncounterDiagnosis({
        conditionReference: {
          reference: `Condition/${conditionId}`,
          ...(options?.display ? { display: options.display } : {}),
        },
        ...(options?.use ? { use: options.use } : {}),
        ...(options?.rank !== undefined ? { rank: options.rank } : {}),
      }),
    );
  }

  public addEpisodeOfCare(reference: Reference): this {
    this.draft.episodeOfCare = [...(this.draft.episodeOfCare ?? []), reference];
    return this;
  }

  public addIdentifier(identifier: EncounterIdentifier): this {
    this.draft.identifier = [...this.draft.identifier, identifier];
    return this;
  }

  public addLocation(location: EncounterLocation): this {
    this.draft.location = [...this.draft.location, location];
    return this;
  }

  public addParticipant(participant: EncounterParticipant): this {
    this.draft.participant = [...(this.draft.participant ?? []), participant];
    return this;
  }

  public addReasonCode(reasonCode: NonNullable<EncounterCreateInput["reasonCode"]>[number]): this {
    this.draft.reasonCode = [...(this.draft.reasonCode ?? []), reasonCode];
    return this;
  }

  public addReasonReference(reference: Reference): this {
    this.draft.reasonReference = [...(this.draft.reasonReference ?? []), reference];
    return this;
  }

  public addStatusHistory(statusHistory: EncounterStatusHistory): this {
    this.draft.statusHistory = [...this.draft.statusHistory, statusHistory];
    return this;
  }

  public addClassHistory(classHistory: EncounterClassHistory): this {
    this.draft.classHistory = [...this.draft.classHistory, classHistory];
    return this;
  }

  public addType(type: NonNullable<EncounterCreateInput["type"]>[number]): this {
    this.draft.type = [...(this.draft.type ?? []), type];
    return this;
  }

  public merge(input: Partial<Omit<EncounterCreateInput, "resourceType">>): this {
    this.draft = EncounterCreateSchema.parse({
      ...this.draft,
      ...input,
    });
    return this;
  }

  public setClass(value: EncounterClass): this {
    this.draft.class = value;
    return this;
  }

  public setHospitalization(value: EncounterHospitalization): this {
    this.draft.hospitalization = value;
    return this;
  }

  public setInpatientHospitalization(input: EncounterHospitalizationHelperInput): this {
    this.draft.hospitalization = createEncounterHospitalization(input);
    return this;
  }

  public setLength(value: NonNullable<EncounterCreateInput["length"]>): this {
    this.draft.length = value;
    return this;
  }

  public setPartOf(reference: Reference): this {
    this.draft.partOf = reference;
    return this;
  }

  public setPeriod(value: EncounterCreateInput["period"]): this {
    this.draft.period = value;
    return this;
  }

  public setPreset(preset: EncounterBuilderPreset): this {
    this.draft.class = cloneEncounterClass(ENCOUNTER_CLASS_PRESETS[preset]);
    return this;
  }

  public setConsultationMethod(method: EncounterConsultationMethod): this {
    this.draft.class = createEncounterClassFromConsultationMethod(method);
    return this;
  }

  public setPriority(value: NonNullable<EncounterCreateInput["priority"]>): this {
    this.draft.priority = value;
    return this;
  }

  public setServiceProvider(reference: Reference): this {
    this.draft.serviceProvider = reference;
    return this;
  }

  public setServiceType(value: NonNullable<EncounterCreateInput["serviceType"]>): this {
    this.draft.serviceType = value;
    return this;
  }

  public setLocationServiceClass(locationIndex: number, input: EncounterServiceClassInput): this {
    const location = this.draft.location[locationIndex];

    if (!location) {
      throw new RangeError(`Encounter location at index ${locationIndex} does not exist`);
    }

    this.draft.location[locationIndex] = withEncounterLocationServiceClass(location, input);
    return this;
  }

  /**
   * Moves to the next status at `at` (for example arrived -> in-progress): the open status
   * history entry gets `period.end = at` and a new open entry starts.
   */
  public advanceStatus(status: EncounterStatus, at: string): this {
    parseIsoDateTime(at, "Encounter status time");

    this.draft.statusHistory = [
      ...this.draft.statusHistory.map((entry) => closePeriod(entry, at)),
      { status, period: { start: at } },
    ];
    this.draft.status = status;
    return this;
  }

  /**
   * Finishes the encounter at `at`: closes every open status, class, location, and participant
   * period, adds the "finished" status, and sets `period.end`.
   */
  public finish(at: string): this {
    parseIsoDateTime(at, "Encounter finish time");

    const statusHistory = this.draft.statusHistory.map((entry) => closePeriod(entry, at));
    const alreadyFinished = statusHistory[statusHistory.length - 1]?.status === "finished";

    this.draft.statusHistory = alreadyFinished
      ? statusHistory
      : [...statusHistory, { status: "finished", period: { start: at, end: at } }];
    this.draft.classHistory = this.draft.classHistory.map((entry) => closePeriod(entry, at));
    this.draft.location = this.draft.location.map((location) =>
      location.period && !location.period.end
        ? { ...location, status: "completed", period: { ...location.period, end: at } }
        : location,
    );
    this.draft.participant = this.draft.participant?.map((participant) =>
      participant.period && !participant.period.end
        ? { ...participant, period: { ...participant.period, end: at } }
        : participant,
    );
    this.draft.period = { ...this.draft.period, end: this.draft.period.end ?? at };
    this.draft.status = "finished";
    return this;
  }

  /**
   * Sets the SIRS Online status extensions: Status Pengunjung (`facility`), Status Kunjungan
   * Spesialisasi (`specialty`), and Status Episode Pelayanan (`episode`). Existing values of the
   * given kinds are replaced.
   */
  public setNovelty(statuses: {
    [Kind in EncounterNoveltyKind]?: EncounterNoveltyCode | undefined;
  }): this {
    const entries = (
      Object.entries(statuses) as Array<[EncounterNoveltyKind, EncounterNoveltyCode | undefined]>
    ).filter((entry): entry is [EncounterNoveltyKind, EncounterNoveltyCode] => !!entry[1]);
    const replacedUrls = new Set<string>(
      entries.map(([kind]) => ENCOUNTER_NOVELTY_EXTENSION_URLS[kind]),
    );

    this.draft.extension = [
      ...(this.draft.extension ?? []).filter((entry) => !replacedUrls.has(entry.url)),
      ...entries.map(([kind, code]) => createEncounterNoveltyExtension(kind, code)),
    ];
    return this;
  }

  /** Closes the current location and continues in `next` from `at`. See moveEncounterLocation. */
  public moveToLocation(next: EncounterLocation | EncounterLocationHelperInput, at: string): this {
    this.draft.location = moveEncounterLocation(this.draft.location, next, at);
    return this;
  }

  public setStatus(value: EncounterStatus): this {
    this.draft.status = value;
    return this;
  }

  public setSubject(reference: Reference): this {
    this.draft.subject = reference;
    return this;
  }

  public build(): EncounterCreateInput {
    return EncounterCreateSchema.parse(this.draft);
  }
}

export function createEncounterBuilder(input: EncounterBuilderInput): EncounterBuilder {
  return new EncounterBuilder(input);
}

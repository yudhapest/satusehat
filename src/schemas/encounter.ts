import { z } from "zod";

import {
  CodeableConceptSchema,
  CodingSchema,
  createSearchBundleSchema,
  IdentifierSchema,
  MetaSchema,
  PeriodSchema,
  ReferenceSchema,
} from "./common";
import {
  ENCOUNTER_ADMIT_SOURCE_SYSTEMS,
  ENCOUNTER_DISCHARGE_DISPOSITION_SYSTEMS,
  ENCOUNTER_INPATIENT_SERVICE_CLASSES,
  ENCOUNTER_SERVICE_CLASS_EXTENSION_URL,
  ENCOUNTER_SERVICE_CLASS_SYSTEMS,
  ENCOUNTER_UPGRADE_CLASS_SYSTEM,
} from "./encounter-terminology";

export const EncounterIdentifierSchema = IdentifierSchema.extend({
  system: z
    .string()
    .regex(
      /^http:\/\/sys-ids\.kemkes\.go\.id\/encounter\/.+$/,
      "Encounter identifier.system must use http://sys-ids.kemkes.go.id/encounter/{organization-ihs-number}",
    ),
  value: z.string().min(1),
});

export const EncounterStatusSchema = z.enum([
  "planned",
  "arrived",
  "triaged",
  "in-progress",
  "onleave",
  "finished",
  "cancelled",
  "entered-in-error",
  "unknown",
]);

export const EncounterClassSchema = CodingSchema.extend({
  system: z.string().min(1),
  code: z.string().min(1),
});

// `end` is optional while a stage is still ongoing, for example an inpatient stay that has
// not been discharged yet. Submitted encounters with status "finished" must close every period.
export const EncounterPeriodSchema = z.object({
  start: z.string().min(1),
  end: z.string().min(1).optional(),
});

export const EncounterStatusHistorySchema = z.object({
  status: EncounterStatusSchema,
  period: EncounterPeriodSchema,
});

export const EncounterClassHistorySchema = z.object({
  class: EncounterClassSchema,
  period: EncounterPeriodSchema,
});

export const EncounterRequiredCodeableConceptSchema = CodeableConceptSchema.extend({
  coding: z.array(EncounterClassSchema).min(1),
});

export const EncounterParticipantSchema = z.object({
  type: z.array(EncounterRequiredCodeableConceptSchema).optional(),
  period: PeriodSchema.optional(),
  individual: ReferenceSchema.optional(),
});

export const EncounterDiagnosisSchema = z.object({
  condition: ReferenceSchema,
  use: EncounterRequiredCodeableConceptSchema,
  rank: z.number().int().positive(),
});

export const EncounterHospitalizationLocationReferenceSchema = ReferenceSchema.extend({
  reference: z
    .string()
    .regex(
      /^(Location|Organization|HealthcareService|Patient)\/.+$/,
      "Encounter hospitalization references must target Location, Organization, HealthcareService, or Patient",
    ),
});

// Code systems are read leniently; submitted encounters must use the official systems
// (checked in validateEncounterSubmission).
export const EncounterAdmitSourceCodingSchema = CodingSchema.extend({
  system: z.string().min(1),
  code: z.string().min(1),
});

export const EncounterAdmitSourceSchema = CodeableConceptSchema.extend({
  coding: z.array(EncounterAdmitSourceCodingSchema).min(1),
});

export const EncounterDischargeDispositionCodingSchema = CodingSchema.extend({
  system: z.string().min(1),
  code: z.string().min(1),
});

export const EncounterDischargeDispositionSchema = CodeableConceptSchema.extend({
  coding: z.array(EncounterDischargeDispositionCodingSchema).min(1),
});

export const EncounterHospitalizationSchema = z.object({
  preAdmissionIdentifier: IdentifierSchema.optional(),
  origin: EncounterHospitalizationLocationReferenceSchema.optional(),
  admitSource: EncounterAdmitSourceSchema.optional(),
  reAdmission: CodeableConceptSchema.optional(),
  dietPreference: z.array(CodeableConceptSchema).optional(),
  specialArrangement: z.array(CodeableConceptSchema).optional(),
  destination: EncounterHospitalizationLocationReferenceSchema.optional(),
  dischargeDisposition: EncounterDischargeDispositionSchema.optional(),
});

const codeableConceptWithSystem = <TSystem extends z.ZodType<string>>(system: TSystem) =>
  CodeableConceptSchema.extend({
    coding: z.array(CodingSchema.extend({ system, code: z.string().min(1) })).min(1),
  });

export const EncounterLocationServiceClassValueSchema = z.object({
  url: z.literal("value"),
  valueCodeableConcept: codeableConceptWithSystem(z.enum(ENCOUNTER_SERVICE_CLASS_SYSTEMS)),
});

export const EncounterLocationUpgradeClassIndicatorSchema = z.object({
  url: z.literal("upgradeClassIndicator"),
  valueCodeableConcept: codeableConceptWithSystem(z.literal(ENCOUNTER_UPGRADE_CLASS_SYSTEM)),
});

export const EncounterLocationServiceClassExtensionSchema = z
  .object({
    url: z.literal(ENCOUNTER_SERVICE_CLASS_EXTENSION_URL),
    extension: z.array(
      z.union([
        EncounterLocationServiceClassValueSchema,
        EncounterLocationUpgradeClassIndicatorSchema,
      ]),
    ),
  })
  .superRefine((value, ctx) => {
    const count = (url: string) => value.extension.filter((entry) => entry.url === url).length;

    if (count("value") !== 1) {
      ctx.addIssue({
        code: "custom",
        message: "ServiceClass extension must contain exactly one value sub-extension",
        path: ["extension"],
      });
    }

    if (count("upgradeClassIndicator") > 1) {
      ctx.addIssue({
        code: "custom",
        message: "ServiceClass extension allows at most one upgradeClassIndicator sub-extension",
        path: ["extension"],
      });
    }
  });

// Location extensions are read leniently so encounters stored by other systems still parse.
// Submitted encounters are checked by validateEncounterSubmission below.
export const EncounterLocationExtensionSchema = z.object({ url: z.string().min(1) }).passthrough();

export const EncounterLocationSchema = z.object({
  location: ReferenceSchema,
  status: z.enum(["planned", "active", "reserved", "completed"]).optional(),
  physicalType: CodeableConceptSchema.optional(),
  period: PeriodSchema.optional(),
  extension: z.array(EncounterLocationExtensionSchema).optional(),
});

export const EncounterDurationSchema = z.object({
  value: z.number(),
  unit: z.string().optional(),
  system: z.string().optional(),
  code: z.string().optional(),
});

export const EncounterPatchOperationSchema = z.object({
  op: z.literal("replace"),
  path: z.string().min(1),
  value: z.unknown(),
});

export const EncounterPatchSchema = z.array(EncounterPatchOperationSchema).min(1);

export const EncounterSearchParamsSchema = z.object({
  subject: z.string().min(1),
});

export const EncounterExtensionSchema = z.object({ url: z.string().min(1) }).passthrough();

export const EncounterBaseSchema = z.object({
  resourceType: z.literal("Encounter"),
  extension: z.array(EncounterExtensionSchema).optional(),
  identifier: z.array(EncounterIdentifierSchema).min(1),
  status: EncounterStatusSchema,
  statusHistory: z.array(EncounterStatusHistorySchema).min(1),
  class: EncounterClassSchema,
  classHistory: z.array(EncounterClassHistorySchema).min(1),
  type: z.array(CodeableConceptSchema).optional(),
  serviceType: CodeableConceptSchema.optional(),
  priority: CodeableConceptSchema.optional(),
  subject: ReferenceSchema,
  episodeOfCare: z.array(ReferenceSchema).optional(),
  basedOn: z.array(ReferenceSchema).optional(),
  participant: z.array(EncounterParticipantSchema).optional(),
  period: EncounterPeriodSchema,
  length: EncounterDurationSchema.optional(),
  reasonCode: z.array(EncounterRequiredCodeableConceptSchema).min(1).optional(),
  reasonReference: z.array(ReferenceSchema).optional(),
  diagnosis: z.array(EncounterDiagnosisSchema).min(1).optional(),
  account: z.array(ReferenceSchema).optional(),
  hospitalization: EncounterHospitalizationSchema.optional(),
  location: z.array(EncounterLocationSchema).min(1),
  serviceProvider: ReferenceSchema,
  partOf: ReferenceSchema.optional(),
});

const LEGACY_SERVICE_CLASS_EXTENSION_URL =
  "https://fhir.kemkes.go.id/r4/StructureDefinition/serviceClass";

const OUTPATIENT_SERVICE_CLASS_ENCOUNTERS = new Set(["AMB", "EMER"]);
const INPATIENT_SERVICE_CLASS_ENCOUNTERS = new Set(["IMP", "ACUTE", "NONAC"]);

// Rawat jalan and IGD use the outpatient service classes; rawat inap uses the inpatient ones.
function checkServiceClassMatchesEncounterClass(
  encounterClass: string,
  serviceClassCode: string,
  path: (string | number)[],
  ctx: z.RefinementCtx,
): void {
  const isInpatientCode = Object.hasOwn(ENCOUNTER_INPATIENT_SERVICE_CLASSES, serviceClassCode);

  if (OUTPATIENT_SERVICE_CLASS_ENCOUNTERS.has(encounterClass) && isInpatientCode) {
    ctx.addIssue({
      code: "custom",
      message:
        `Encounter class ${encounterClass} must use an outpatient service class ` +
        `(reguler or eksekutif), not ${serviceClassCode}`,
      path,
    });
  }

  if (INPATIENT_SERVICE_CLASS_ENCOUNTERS.has(encounterClass) && !isInpatientCode) {
    ctx.addIssue({
      code: "custom",
      message:
        `Encounter class ${encounterClass} must use an inpatient service class ` +
        `(1, 2, 3, vip, vvip, or KRIS), not ${serviceClassCode}`,
      path,
    });
  }
}

function validateEncounterSubmission(
  encounter: z.infer<typeof EncounterBaseSchema>,
  ctx: z.RefinementCtx,
): void {
  encounter.location.forEach((location, locationIndex) => {
    location.extension?.forEach((extension, extensionIndex) => {
      const path = ["location", locationIndex, "extension", extensionIndex];

      if (extension.url === LEGACY_SERVICE_CLASS_EXTENSION_URL) {
        ctx.addIssue({
          code: "custom",
          message:
            `Use ${ENCOUNTER_SERVICE_CLASS_EXTENSION_URL} for the service class extension ` +
            "(createEncounterLocationServiceClassExtension)",
          path,
        });
        return;
      }

      if (extension.url !== ENCOUNTER_SERVICE_CLASS_EXTENSION_URL) {
        return;
      }

      const parsed = EncounterLocationServiceClassExtensionSchema.safeParse(extension);

      parsed.error?.issues.forEach((issue) => {
        ctx.addIssue({ code: "custom", message: issue.message, path: [...path, ...issue.path] });
      });

      const serviceClassCode = parsed.data?.extension.find((entry) => entry.url === "value")
        ?.valueCodeableConcept.coding[0]?.code;

      if (serviceClassCode !== undefined) {
        checkServiceClassMatchesEncounterClass(encounter.class.code, serviceClassCode, path, ctx);
      }
    });
  });

  const codedHospitalizationFields = [
    ["admitSource", encounter.hospitalization?.admitSource, ENCOUNTER_ADMIT_SOURCE_SYSTEMS],
    [
      "dischargeDisposition",
      encounter.hospitalization?.dischargeDisposition,
      ENCOUNTER_DISCHARGE_DISPOSITION_SYSTEMS,
    ],
  ] as const;

  codedHospitalizationFields.forEach(([field, value, systems]) => {
    value?.coding.forEach((coding, index) => {
      if (!(systems as readonly string[]).includes(coding.system)) {
        ctx.addIssue({
          code: "custom",
          message: `hospitalization.${field} must use one of: ${systems.join(", ")}`,
          path: ["hospitalization", field, "coding", index, "system"],
        });
      }
    });
  });

  if (encounter.status !== "finished") {
    return;
  }

  const openPeriods: Array<[string, ...(string | number)[]]> = [];

  if (!encounter.period.end) openPeriods.push(["period", "end"]);
  encounter.statusHistory.forEach((entry, index) => {
    if (!entry.period.end) openPeriods.push(["statusHistory", index, "period", "end"]);
  });
  encounter.classHistory.forEach((entry, index) => {
    if (!entry.period.end) openPeriods.push(["classHistory", index, "period", "end"]);
  });

  openPeriods.forEach((path) => {
    ctx.addIssue({
      code: "custom",
      message: 'A "finished" encounter must have an end time',
      path,
    });
  });
}

// Elements marked mandatory (*) in the "Pendaftaran Kunjungan" mapping of each SATUSEHAT guide.
// They differ per care setting, so they are keyed by Encounter.class.
const GUIDE_REQUIREMENTS: Record<
  string,
  {
    guide: string;
    participantType: boolean;
    participantIndividual: boolean;
    dischargeDisposition: boolean;
    serviceClass?: readonly string[];
  }
> = {
  AMB: {
    guide: "Rawat Jalan",
    participantType: true,
    participantIndividual: true,
    dischargeDisposition: true,
  },
  EMER: {
    guide: "IGD",
    participantType: true,
    participantIndividual: false,
    dischargeDisposition: true,
    serviceClass: ["reguler"],
  },
  IMP: {
    guide: "Rawat Inap",
    participantType: false,
    participantIndividual: true,
    dischargeDisposition: false,
  },
};

function validateEncounterGuideRequirements(
  encounter: z.infer<typeof EncounterBaseSchema>,
  ctx: z.RefinementCtx,
): void {
  const rules = GUIDE_REQUIREMENTS[encounter.class.code];

  if (!rules) {
    return;
  }

  const issue = (message: string, path: (string | number)[]) =>
    ctx.addIssue({ code: "custom", message: `${message} (SATUSEHAT ${rules.guide})`, path });

  if (!encounter.participant?.length) {
    issue("Encounter.participant is required", ["participant"]);
  }

  encounter.participant?.forEach((participant, index) => {
    if (rules.participantType && !participant.type?.length) {
      issue("Encounter.participant.type is required", ["participant", index, "type"]);
    }

    if (rules.participantIndividual && !participant.individual) {
      issue("Encounter.participant.individual is required", ["participant", index, "individual"]);
    }
  });

  if (rules.serviceClass) {
    encounter.location.forEach((location, index) => {
      const serviceClass = location.extension?.find(
        (extension) => extension.url === ENCOUNTER_SERVICE_CLASS_EXTENSION_URL,
      );
      const code = EncounterLocationServiceClassExtensionSchema.safeParse(
        serviceClass,
      ).data?.extension.find((entry) => entry.url === "value")?.valueCodeableConcept.coding[0]
        ?.code;

      if (!code) {
        issue("Encounter.location needs the ServiceClass extension", ["location", index]);
      } else if (!rules.serviceClass?.includes(code)) {
        issue(`Encounter.location service class must be ${rules.serviceClass?.join(" or ")}`, [
          "location",
          index,
        ]);
      }
    });
  }

  if (encounter.status !== "finished") {
    return;
  }

  if (!encounter.diagnosis?.length) {
    issue('A "finished" encounter needs Encounter.diagnosis', ["diagnosis"]);
  }

  if (rules.dischargeDisposition && !encounter.hospitalization?.dischargeDisposition) {
    issue('A "finished" encounter needs hospitalization.dischargeDisposition', [
      "hospitalization",
      "dischargeDisposition",
    ]);
  }
}

// Drafts built by EncounterBuilder (structure and finished/period rules).
export const EncounterCreateSchema = EncounterBaseSchema.superRefine(validateEncounterSubmission);

// What client.encounter.create sends: drafts plus the per-guide mandatory elements.
export const EncounterSubmitSchema = EncounterBaseSchema.superRefine(
  validateEncounterSubmission,
).superRefine(validateEncounterGuideRequirements);

export const EncounterSchema = EncounterBaseSchema.extend({
  id: z.string().min(1),
  meta: MetaSchema.optional(),
});

export const EncounterUpdateSchema = EncounterSchema.superRefine(
  validateEncounterSubmission,
).superRefine(validateEncounterGuideRequirements);

export const EncounterUpdateParamsSchema = z.object({
  id: z.string().min(1),
});

export const EncounterBundleSchema = createSearchBundleSchema(EncounterSchema);

export type EncounterIdentifier = z.infer<typeof EncounterIdentifierSchema>;
export type EncounterStatus = z.infer<typeof EncounterStatusSchema>;
export type EncounterClass = z.infer<typeof EncounterClassSchema>;
export type EncounterStatusHistory = z.infer<typeof EncounterStatusHistorySchema>;
export type EncounterClassHistory = z.infer<typeof EncounterClassHistorySchema>;
export type EncounterParticipant = z.infer<typeof EncounterParticipantSchema>;
export type EncounterDiagnosis = z.infer<typeof EncounterDiagnosisSchema>;
export type EncounterHospitalizationLocationReference = z.infer<
  typeof EncounterHospitalizationLocationReferenceSchema
>;
export type EncounterAdmitSourceCoding = z.infer<typeof EncounterAdmitSourceCodingSchema>;
export type EncounterAdmitSource = z.infer<typeof EncounterAdmitSourceSchema>;
export type EncounterDischargeDispositionCoding = z.infer<
  typeof EncounterDischargeDispositionCodingSchema
>;
export type EncounterDischargeDisposition = z.infer<typeof EncounterDischargeDispositionSchema>;
export type EncounterHospitalization = z.infer<typeof EncounterHospitalizationSchema>;
export type EncounterPeriod = z.infer<typeof EncounterPeriodSchema>;
export type EncounterExtension = z.infer<typeof EncounterExtensionSchema>;
export type EncounterLocationServiceClassValue = z.infer<
  typeof EncounterLocationServiceClassValueSchema
>;
export type EncounterLocationUpgradeClassIndicator = z.infer<
  typeof EncounterLocationUpgradeClassIndicatorSchema
>;
export type EncounterLocationServiceClassExtension = z.infer<
  typeof EncounterLocationServiceClassExtensionSchema
>;
export type EncounterLocationExtension = z.infer<typeof EncounterLocationExtensionSchema>;
export type EncounterLocation = z.infer<typeof EncounterLocationSchema>;
export type EncounterDuration = z.infer<typeof EncounterDurationSchema>;
export type EncounterPatchOperation = z.infer<typeof EncounterPatchOperationSchema>;
export type EncounterPatchInput = z.infer<typeof EncounterPatchSchema>;
export type Encounter = z.infer<typeof EncounterSchema>;
export type EncounterCreateInput = z.infer<typeof EncounterCreateSchema>;
export type EncounterUpdateInput = z.infer<typeof EncounterSchema>;
export type EncounterSearchParams = z.infer<typeof EncounterSearchParamsSchema>;
export type EncounterSearchResponse = z.infer<typeof EncounterBundleSchema>;

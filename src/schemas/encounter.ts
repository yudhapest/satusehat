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

export const EncounterStatusHistorySchema = z.object({
  status: EncounterStatusSchema,
  period: z.object({
    start: z.string().min(1),
    end: z.string().min(1),
  }),
});

export const EncounterClassHistorySchema = z.object({
  class: EncounterClassSchema,
  period: z.object({
    start: z.string().min(1),
    end: z.string().min(1),
  }),
});

export const EncounterRequiredCodeableConceptSchema = CodeableConceptSchema.extend({
  coding: z.array(EncounterClassSchema).min(1),
});

export const EncounterParticipantSchema = z.object({
  type: z.array(EncounterRequiredCodeableConceptSchema).optional(),
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

export const EncounterAdmitSourceCodingSchema = CodingSchema.extend({
  system: z.literal("http://terminology.hl7.org/CodeSystem/admit-source"),
  code: z.string().min(1),
});

export const EncounterAdmitSourceSchema = CodeableConceptSchema.extend({
  coding: z.array(EncounterAdmitSourceCodingSchema).min(1),
});

export const EncounterDischargeDispositionCodingSchema = CodingSchema.extend({
  system: z.literal("http://terminology.hl7.org/CodeSystem/discharge-disposition"),
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

export const EncounterLocationServiceClassValueSchema = z.object({
  url: z.literal("valueCode"),
  valueCode: z.string().min(1),
});

export const EncounterLocationServiceClassExtensionSchema = z.object({
  url: z.literal("https://fhir.kemkes.go.id/r4/StructureDefinition/serviceClass"),
  extension: z.array(EncounterLocationServiceClassValueSchema).min(1),
});

const GenericEncounterLocationExtensionSchema = z
  .object({ url: z.string().min(1) })
  .passthrough()
  .refine(
    (value) => value.url !== "https://fhir.kemkes.go.id/r4/StructureDefinition/serviceClass",
    "serviceClass extension must include a structured valueCode entry",
  );

export const EncounterLocationExtensionSchema = z.union([
  EncounterLocationServiceClassExtensionSchema,
  GenericEncounterLocationExtensionSchema,
]);

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

export const EncounterBaseSchema = z.object({
  resourceType: z.literal("Encounter"),
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
  period: z.object({
    start: z.string().min(1),
    end: z.string().min(1),
  }),
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

export const EncounterCreateSchema = EncounterBaseSchema;

export const EncounterSchema = EncounterBaseSchema.extend({
  id: z.string().min(1),
  meta: MetaSchema.optional(),
});

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
export type EncounterLocationServiceClassValue = z.infer<
  typeof EncounterLocationServiceClassValueSchema
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

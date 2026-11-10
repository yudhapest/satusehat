import { z } from "zod";

import {
  CodeableConceptSchema,
  createSearchBundleSchema,
  IdentifierSchema,
  MetaSchema,
  PeriodSchema,
  ReferenceSchema,
} from "./common";

export const MedicationRequestIdentifierSchema = IdentifierSchema.extend({
  system: z
    .string()
    .refine(
      (value) =>
        /^http:\/\/sys-ids\.kemkes\.go\.id\/prescription\/[^/]+\/[^/]+$/.test(value) ||
        /^http:\/\/sys-ids\.kemkes\.go\.id\/prescription-item\/[^/]+$/.test(value),
      "MedicationRequest identifier.system must use http://sys-ids.kemkes.go.id/prescription/{organization-ihs-number}/{subsystem} or http://sys-ids.kemkes.go.id/prescription-item/{organization-ihs-number}",
    ),
  value: z.string().min(1),
});

export const MedicationRequestStatusSchema = z.enum([
  "active",
  "on-hold",
  "cancelled",
  "completed",
  "entered-in-error",
  "stopped",
  "draft",
  "unknown",
]);

export const MedicationRequestIntentSchema = z.enum([
  "proposal",
  "plan",
  "order",
  "original-order",
  "reflex-order",
  "filler-order",
  "instance-order",
  "option",
]);

export const MedicationRequestPrioritySchema = z.enum(["routine", "urgent", "asap", "stat"]);

export const MedicationRequestCodingSchema = z.object({
  system: z.string().min(1),
  code: z.string().min(1),
  display: z.string().optional(),
});

export const MedicationRequestQuantitySchema = z.object({
  value: z.number(),
  unit: z.string().optional(),
  system: z.string().optional(),
  code: z.string().optional(),
});

export const MedicationRequestRangeSchema = z.object({
  low: MedicationRequestQuantitySchema.optional(),
  high: MedicationRequestQuantitySchema.optional(),
});

export const MedicationRequestRatioSchema = z.object({
  numerator: MedicationRequestQuantitySchema.optional(),
  denominator: MedicationRequestQuantitySchema.optional(),
});

export const MedicationRequestNoteSchema = z.object({
  authorReference: ReferenceSchema.optional(),
  authorString: z.string().min(1).optional(),
  time: z.string().optional(),
  text: z.string().min(1),
});

export const MedicationRequestTimingRepeatSchema = z.object({
  boundsPeriod: PeriodSchema.optional(),
  count: z.number().int().positive().optional(),
  countMax: z.number().int().positive().optional(),
  duration: z.number().positive().optional(),
  durationMax: z.number().positive().optional(),
  durationUnit: z.string().optional(),
  frequency: z.number().int().positive().optional(),
  frequencyMax: z.number().int().positive().optional(),
  period: z.number().positive().optional(),
  periodMax: z.number().positive().optional(),
  periodUnit: z.string().optional(),
  dayOfWeek: z.array(z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"])).optional(),
  timeOfDay: z.array(z.string()).optional(),
});

export const MedicationRequestTimingSchema = z.object({
  code: CodeableConceptSchema.optional(),
  repeat: MedicationRequestTimingRepeatSchema.optional(),
});

export const MedicationRequestDoseAndRateSchema = z.object({
  type: CodeableConceptSchema.optional(),
  doseRange: MedicationRequestRangeSchema.optional(),
  doseQuantity: MedicationRequestQuantitySchema.optional(),
  rateRatio: MedicationRequestRatioSchema.optional(),
  rateRange: MedicationRequestRangeSchema.optional(),
  rateQuantity: MedicationRequestQuantitySchema.optional(),
});

export const MedicationRequestDosageInstructionSchema = z.object({
  sequence: z.number().int().positive().optional(),
  text: z.string().optional(),
  additionalInstruction: z.array(CodeableConceptSchema).optional(),
  patientInstruction: z.string().optional(),
  timing: MedicationRequestTimingSchema.optional(),
  asNeededBoolean: z.boolean().optional(),
  site: CodeableConceptSchema.optional(),
  route: CodeableConceptSchema.optional(),
  method: CodeableConceptSchema.optional(),
  doseAndRate: z.array(MedicationRequestDoseAndRateSchema).optional(),
  maxDosePerPeriod: MedicationRequestRatioSchema.optional(),
  maxDosePerAdministration: MedicationRequestQuantitySchema.optional(),
  maxDosePerLifetime: MedicationRequestQuantitySchema.optional(),
});

export const MedicationRequestDispenseRequestSchema = z.object({
  dispenseInterval: MedicationRequestQuantitySchema.optional(),
  validityPeriod: PeriodSchema.optional(),
  numberOfRepeatsAllowed: z.number().int().min(0).optional(),
  quantity: MedicationRequestQuantitySchema.optional(),
  expectedSupplyDuration: MedicationRequestQuantitySchema.optional(),
  performer: ReferenceSchema.optional(),
});

export const MedicationRequestSubstitutionSchema = z.object({
  allowedBoolean: z.boolean().optional(),
  allowedCodeableConcept: CodeableConceptSchema.optional(),
  reason: CodeableConceptSchema.optional(),
});

export const MedicationRequestPatchOperationSchema = z.object({
  op: z.literal("replace"),
  path: z.string().min(1),
  value: z.unknown(),
});

export const MedicationRequestPatchSchema = z.array(MedicationRequestPatchOperationSchema).min(1);

export const MedicationRequestSearchParamsSchema = z
  .object({
    subject: z.string().min(1).optional(),
    encounter: z.guid().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.subject || value.encounter) {
      return;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Use at least one MedicationRequest search parameter: subject or encounter",
      path: ["subject"],
    });
  });

export const MedicationRequestBaseSchema = z.object({
  resourceType: z.literal("MedicationRequest"),
  identifier: z.array(MedicationRequestIdentifierSchema).optional(),
  basedOn: z.array(ReferenceSchema).optional(),
  status: MedicationRequestStatusSchema,
  statusReason: CodeableConceptSchema.optional(),
  intent: MedicationRequestIntentSchema,
  category: z.array(CodeableConceptSchema).optional(),
  priority: MedicationRequestPrioritySchema.optional(),
  reportedBoolean: z.boolean().optional(),
  medicationReference: ReferenceSchema,
  subject: ReferenceSchema,
  encounter: ReferenceSchema.optional(),
  authoredOn: z.string().optional(),
  requester: ReferenceSchema.optional(),
  performer: ReferenceSchema.optional(),
  performerType: CodeableConceptSchema.optional(),
  recorder: ReferenceSchema.optional(),
  reasonCode: z.array(CodeableConceptSchema).optional(),
  reasonReference: z.array(ReferenceSchema).optional(),
  insurance: z.array(ReferenceSchema).optional(),
  note: z.array(MedicationRequestNoteSchema).optional(),
  dosageInstruction: z.array(MedicationRequestDosageInstructionSchema).optional(),
  dispenseRequest: MedicationRequestDispenseRequestSchema.optional(),
  substitution: MedicationRequestSubstitutionSchema.optional(),
});

export const MedicationRequestCreateSchema = MedicationRequestBaseSchema;

export const MedicationRequestSchema = MedicationRequestBaseSchema.extend({
  id: z.string().min(1),
  meta: MetaSchema.optional(),
});

export const MedicationRequestUpdateParamsSchema = z.object({
  id: z.string().min(1),
});

export const MedicationRequestBundleSchema = createSearchBundleSchema(MedicationRequestSchema);

export type MedicationRequestIdentifier = z.infer<typeof MedicationRequestIdentifierSchema>;
export type MedicationRequestStatus = z.infer<typeof MedicationRequestStatusSchema>;
export type MedicationRequestIntent = z.infer<typeof MedicationRequestIntentSchema>;
export type MedicationRequestPriority = z.infer<typeof MedicationRequestPrioritySchema>;
export type MedicationRequestCoding = z.infer<typeof MedicationRequestCodingSchema>;
export type MedicationRequestQuantity = z.infer<typeof MedicationRequestQuantitySchema>;
export type MedicationRequestRange = z.infer<typeof MedicationRequestRangeSchema>;
export type MedicationRequestRatio = z.infer<typeof MedicationRequestRatioSchema>;
export type MedicationRequestTimingRepeat = z.infer<typeof MedicationRequestTimingRepeatSchema>;
export type MedicationRequestTiming = z.infer<typeof MedicationRequestTimingSchema>;
export type MedicationRequestDoseAndRate = z.infer<typeof MedicationRequestDoseAndRateSchema>;
export type MedicationRequestDosageInstruction = z.infer<typeof MedicationRequestDosageInstructionSchema>;
export type MedicationRequestDispenseRequest = z.infer<typeof MedicationRequestDispenseRequestSchema>;
export type MedicationRequestSubstitution = z.infer<typeof MedicationRequestSubstitutionSchema>;
export type MedicationRequestNote = z.infer<typeof MedicationRequestNoteSchema>;
export type MedicationRequestPatchOperation = z.infer<typeof MedicationRequestPatchOperationSchema>;
export type MedicationRequestPatchInput = z.infer<typeof MedicationRequestPatchSchema>;
export type MedicationRequest = z.infer<typeof MedicationRequestSchema>;
export type MedicationRequestCreateInput = z.infer<typeof MedicationRequestCreateSchema>;
export type MedicationRequestSearchParams = z.infer<typeof MedicationRequestSearchParamsSchema>;
export type MedicationRequestSearchResponse = z.infer<typeof MedicationRequestBundleSchema>;

import { z } from "zod";

import {
  BundleEntrySchema,
  BundleLinkSchema,
  CodeableConceptSchema,
  IdentifierSchema,
  MetaSchema,
  PeriodSchema,
  ReferenceSchema,
} from "./common";

export const RiskAssessmentStatusSchema = z.enum([
  "registered",
  "preliminary",
  "final",
  "amended",
  "corrected",
  "cancelled",
  "entered-in-error",
  "unknown",
]);

export const RiskAssessmentCodingSchema = z.object({
  system: z.string().min(1),
  code: z.string().min(1),
  display: z.string().optional(),
});

export const RiskAssessmentRequiredCodeableConceptSchema = CodeableConceptSchema.extend({
  coding: z.array(RiskAssessmentCodingSchema).min(1),
});

export const RiskAssessmentQuantitySchema = z.object({
  value: z.number(),
  unit: z.string().optional(),
  system: z.string().optional(),
  code: z.string().optional(),
});

export const RiskAssessmentRangeSchema = z.object({
  low: RiskAssessmentQuantitySchema.optional(),
  high: RiskAssessmentQuantitySchema.optional(),
});

export const RiskAssessmentPredictionSchema = z.object({
  outcome: CodeableConceptSchema.optional(),
  probabilityDecimal: z.number().min(0).max(1).optional(),
  probabilityRange: RiskAssessmentRangeSchema.optional(),
  qualitativeRisk: CodeableConceptSchema.optional(),
  relativeRisk: z.number().optional(),
  whenPeriod: PeriodSchema.optional(),
  whenRange: RiskAssessmentRangeSchema.optional(),
  rationale: z.string().optional(),
});

export const RiskAssessmentNoteSchema = z.object({
  authorReference: ReferenceSchema.optional(),
  authorString: z.string().min(1).optional(),
  time: z.string().optional(),
  text: z.string().min(1),
});

export const RiskAssessmentPatchOperationSchema = z.object({
  op: z.literal("replace"),
  path: z.string().min(1),
  value: z.unknown(),
});

export const RiskAssessmentPatchSchema = z.array(RiskAssessmentPatchOperationSchema).min(1);

export const RiskAssessmentSearchParamsSchema = z
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
      message: "Use at least one RiskAssessment search parameter: subject or encounter",
      path: ["subject"],
    });
  });

export const RiskAssessmentBaseSchema = z.object({
  resourceType: z.literal("RiskAssessment"),
  identifier: z.array(IdentifierSchema).optional(),
  basedOn: ReferenceSchema.optional(),
  parent: ReferenceSchema.optional(),
  status: RiskAssessmentStatusSchema,
  method: CodeableConceptSchema.optional(),
  code: RiskAssessmentRequiredCodeableConceptSchema.optional(),
  subject: ReferenceSchema,
  encounter: ReferenceSchema.optional(),
  occurrenceDateTime: z.string().optional(),
  occurrencePeriod: PeriodSchema.optional(),
  condition: ReferenceSchema.optional(),
  performer: ReferenceSchema.optional(),
  reasonCode: CodeableConceptSchema.optional(),
  reasonReference: ReferenceSchema.optional(),
  basis: z.array(ReferenceSchema).optional(),
  prediction: z.array(RiskAssessmentPredictionSchema).optional(),
  mitigation: z.string().optional(),
  note: z.array(RiskAssessmentNoteSchema).optional(),
});

export const RiskAssessmentCreateSchema = RiskAssessmentBaseSchema;

export const RiskAssessmentSchema = RiskAssessmentBaseSchema.extend({
  id: z.string().min(1),
  meta: MetaSchema.optional(),
});

export const RiskAssessmentUpdateParamsSchema = z.object({
  id: z.string().min(1),
});

export const RiskAssessmentBundleSchema = z.object({
  resourceType: z.literal("Bundle"),
  type: z.string().optional(),
  total: z.number().optional(),
  link: z.array(BundleLinkSchema).optional(),
  entry: z.array(BundleEntrySchema(RiskAssessmentSchema)).optional(),
});

export type RiskAssessmentStatus = z.infer<typeof RiskAssessmentStatusSchema>;
export type RiskAssessmentCoding = z.infer<typeof RiskAssessmentCodingSchema>;
export type RiskAssessmentQuantity = z.infer<typeof RiskAssessmentQuantitySchema>;
export type RiskAssessmentRange = z.infer<typeof RiskAssessmentRangeSchema>;
export type RiskAssessmentPrediction = z.infer<typeof RiskAssessmentPredictionSchema>;
export type RiskAssessmentNote = z.infer<typeof RiskAssessmentNoteSchema>;
export type RiskAssessmentPatchOperation = z.infer<typeof RiskAssessmentPatchOperationSchema>;
export type RiskAssessmentPatchInput = z.infer<typeof RiskAssessmentPatchSchema>;
export type RiskAssessment = z.infer<typeof RiskAssessmentSchema>;
export type RiskAssessmentCreateInput = z.infer<typeof RiskAssessmentCreateSchema>;
export type RiskAssessmentSearchParams = z.infer<typeof RiskAssessmentSearchParamsSchema>;
export type RiskAssessmentSearchResponse = z.infer<typeof RiskAssessmentBundleSchema>;

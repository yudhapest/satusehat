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

export const ConditionIdentifierSchema = IdentifierSchema.extend({
  system: z
    .string()
    .regex(
      /^http:\/\/sys-ids\.kemkes\.go\.id\/condition\/.+$/,
      "Condition identifier.system must use http://sys-ids.kemkes.go.id/condition/{organization-ihs-number}",
    ),
  value: z.string().min(1),
});

export const ConditionCodingSchema = z.object({
  system: z.string().min(1),
  code: z.string().min(1),
  display: z.string().optional(),
});

export const ConditionRequiredCodeableConceptSchema = CodeableConceptSchema.extend({
  coding: z.array(ConditionCodingSchema).min(1),
});

export const ConditionAgeSchema = z.object({
  value: z.number(),
  unit: z.string().optional(),
  system: z.string().optional(),
  code: z.string().optional(),
});

export const ConditionRangeSchema = z.object({
  low: ConditionAgeSchema.optional(),
  high: ConditionAgeSchema.optional(),
});

export const ConditionStageSchema = z.object({
  summary: CodeableConceptSchema.optional(),
  assessment: z.array(ReferenceSchema).optional(),
  type: CodeableConceptSchema.optional(),
});

export const ConditionEvidenceSchema = z.object({
  code: z.array(CodeableConceptSchema).optional(),
  detail: z.array(ReferenceSchema).optional(),
});

export const ConditionNoteSchema = z.object({
  authorReference: ReferenceSchema.optional(),
  authorString: z.string().min(1).optional(),
  time: z.string().optional(),
  text: z.string().min(1),
});

export const ConditionPatchOperationSchema = z.object({
  op: z.literal("replace"),
  path: z.string().min(1),
  value: z.unknown(),
});

export const ConditionPatchSchema = z.array(ConditionPatchOperationSchema).min(1);

export const ConditionSearchParamsSchema = z
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
      message: "Use at least one Condition search parameter: subject or encounter",
      path: ["subject"],
    });
  });

export const ConditionBaseSchema = z.object({
  resourceType: z.literal("Condition"),
  identifier: z.array(ConditionIdentifierSchema).optional(),
  clinicalStatus: ConditionRequiredCodeableConceptSchema.optional(),
  verificationStatus: ConditionRequiredCodeableConceptSchema.optional(),
  category: z.array(ConditionRequiredCodeableConceptSchema).optional(),
  severity: CodeableConceptSchema.optional(),
  code: ConditionRequiredCodeableConceptSchema,
  bodySite: z.array(CodeableConceptSchema).optional(),
  subject: ReferenceSchema,
  encounter: ReferenceSchema,
  onsetDateTime: z.string().optional(),
  onsetAge: ConditionAgeSchema.optional(),
  onsetPeriod: PeriodSchema.optional(),
  onsetRange: ConditionRangeSchema.optional(),
  onsetString: z.string().optional(),
  abatementDateTime: z.string().optional(),
  abatementAge: ConditionAgeSchema.optional(),
  abatementPeriod: PeriodSchema.optional(),
  abatementRange: ConditionRangeSchema.optional(),
  abatementString: z.string().optional(),
  recordedDate: z.string().optional(),
  recorder: ReferenceSchema.optional(),
  asserter: ReferenceSchema.optional(),
  stage: z.array(ConditionStageSchema).optional(),
  evidence: z.array(ConditionEvidenceSchema).optional(),
  note: z.array(ConditionNoteSchema).optional(),
});

export const ConditionCreateSchema = ConditionBaseSchema;

export const ConditionSchema = ConditionBaseSchema.extend({
  id: z.string().min(1),
  meta: MetaSchema.optional(),
});

export const ConditionUpdateParamsSchema = z.object({
  id: z.string().min(1),
});

export const ConditionBundleSchema = z.object({
  resourceType: z.literal("Bundle"),
  type: z.string().optional(),
  total: z.number().optional(),
  link: z.array(BundleLinkSchema).optional(),
  entry: z.array(BundleEntrySchema(ConditionSchema)).optional(),
});

export type ConditionIdentifier = z.infer<typeof ConditionIdentifierSchema>;
export type ConditionCoding = z.infer<typeof ConditionCodingSchema>;
export type ConditionAge = z.infer<typeof ConditionAgeSchema>;
export type ConditionRange = z.infer<typeof ConditionRangeSchema>;
export type ConditionStage = z.infer<typeof ConditionStageSchema>;
export type ConditionEvidence = z.infer<typeof ConditionEvidenceSchema>;
export type ConditionNote = z.infer<typeof ConditionNoteSchema>;
export type ConditionPatchOperation = z.infer<typeof ConditionPatchOperationSchema>;
export type ConditionPatchInput = z.infer<typeof ConditionPatchSchema>;
export type Condition = z.infer<typeof ConditionSchema>;
export type ConditionCreateInput = z.infer<typeof ConditionCreateSchema>;
export type ConditionSearchParams = z.infer<typeof ConditionSearchParamsSchema>;
export type ConditionSearchResponse = z.infer<typeof ConditionBundleSchema>;

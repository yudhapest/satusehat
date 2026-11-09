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

export const ClinicalImpressionIdentifierSchema = IdentifierSchema;

export const ClinicalImpressionCodingSchema = z.object({
  system: z.string().min(1),
  code: z.string().min(1),
  display: z.string().optional(),
});

export const ClinicalImpressionRequiredCodeableConceptSchema = CodeableConceptSchema.extend({
  coding: z.array(ClinicalImpressionCodingSchema).min(1),
});

export const ClinicalImpressionFindingSchema = z.object({
  itemCodeableConcept: CodeableConceptSchema.optional(),
  itemReference: ReferenceSchema.optional(),
  basis: z.string().optional(),
});

export const ClinicalImpressionNoteSchema = z.object({
  authorReference: ReferenceSchema.optional(),
  authorString: z.string().min(1).optional(),
  time: z.string().optional(),
  text: z.string().min(1),
});

export const ClinicalImpressionPatchOperationSchema = z.object({
  op: z.literal("replace"),
  path: z.string().min(1),
  value: z.unknown(),
});

export const ClinicalImpressionPatchSchema = z
  .array(ClinicalImpressionPatchOperationSchema)
  .min(1);

export const ClinicalImpressionSearchParamsSchema = z
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
      message: "Use at least one ClinicalImpression search parameter: subject or encounter",
      path: ["subject"],
    });
  });

export const ClinicalImpressionBaseSchema = z.object({
  resourceType: z.literal("ClinicalImpression"),
  identifier: z.array(ClinicalImpressionIdentifierSchema).optional(),
  status: z.enum([
    "preparation",
    "in-progress",
    "not-done",
    "on-hold",
    "stopped",
    "completed",
    "entered-in-error",
    "unknown",
  ]),
  statusReason: CodeableConceptSchema.optional(),
  description: z.string().optional(),
  subject: ReferenceSchema,
  encounter: ReferenceSchema.optional(),
  effectiveDateTime: z.string().optional(),
  effectivePeriod: PeriodSchema.optional(),
  date: z.string().optional(),
  assessor: ReferenceSchema.optional(),
  previous: ReferenceSchema.optional(),
  problem: z.array(ReferenceSchema).optional(),
  summary: z.string().optional(),
  finding: z.array(ClinicalImpressionFindingSchema).optional(),
  prognosisCodeableConcept: z.array(CodeableConceptSchema).optional(),
  prognosisReference: z.array(ReferenceSchema).optional(),
  supportingInfo: z.array(ReferenceSchema).optional(),
  note: z.array(ClinicalImpressionNoteSchema).optional(),
});

export const ClinicalImpressionCreateSchema = ClinicalImpressionBaseSchema;

export const ClinicalImpressionSchema = ClinicalImpressionBaseSchema.extend({
  id: z.string().min(1),
  meta: MetaSchema.optional(),
});

export const ClinicalImpressionUpdateParamsSchema = z.object({
  id: z.string().min(1),
});

export const ClinicalImpressionBundleSchema = z.object({
  resourceType: z.literal("Bundle"),
  type: z.string().optional(),
  total: z.number().optional(),
  link: z.array(BundleLinkSchema).optional(),
  entry: z.array(BundleEntrySchema(ClinicalImpressionSchema)).optional(),
});

export type ClinicalImpressionIdentifier = z.infer<typeof ClinicalImpressionIdentifierSchema>;
export type ClinicalImpressionCoding = z.infer<typeof ClinicalImpressionCodingSchema>;
export type ClinicalImpressionFinding = z.infer<typeof ClinicalImpressionFindingSchema>;
export type ClinicalImpressionNote = z.infer<typeof ClinicalImpressionNoteSchema>;
export type ClinicalImpressionPatchOperation = z.infer<typeof ClinicalImpressionPatchOperationSchema>;
export type ClinicalImpressionPatchInput = z.infer<typeof ClinicalImpressionPatchSchema>;
export type ClinicalImpression = z.infer<typeof ClinicalImpressionSchema>;
export type ClinicalImpressionCreateInput = z.infer<typeof ClinicalImpressionCreateSchema>;
export type ClinicalImpressionSearchParams = z.infer<typeof ClinicalImpressionSearchParamsSchema>;
export type ClinicalImpressionSearchResponse = z.infer<typeof ClinicalImpressionBundleSchema>;

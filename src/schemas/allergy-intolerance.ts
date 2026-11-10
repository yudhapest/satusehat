import { z } from "zod";

import {
  CodeableConceptSchema,
  createSearchBundleSchema,
  IdentifierSchema,
  MetaSchema,
  PeriodSchema,
  ReferenceSchema,
} from "./common";

export const AllergyIntoleranceIdentifierSchema = IdentifierSchema;

export const AllergyIntoleranceCodingSchema = z.object({
  system: z.string().min(1),
  code: z.string().min(1),
  display: z.string().optional(),
});

export const AllergyIntoleranceRequiredCodeableConceptSchema = CodeableConceptSchema.extend({
  coding: z.array(AllergyIntoleranceCodingSchema).min(1),
});

export const AllergyIntoleranceQuantitySchema = z.object({
  value: z.number(),
  unit: z.string().optional(),
  system: z.string().optional(),
  code: z.string().optional(),
});

export const AllergyIntoleranceRangeSchema = z.object({
  low: AllergyIntoleranceQuantitySchema.optional(),
  high: AllergyIntoleranceQuantitySchema.optional(),
});

export const AllergyIntoleranceNoteSchema = z.object({
  authorReference: ReferenceSchema.optional(),
  authorString: z.string().min(1).optional(),
  time: z.string().optional(),
  text: z.string().min(1),
});

// A manifestation needs a coding or a text. The SATUSEHAT sandbox currently rejects every coding
// system on reaction.manifestation (RuleNumber 11149) and only accepts text.
export const AllergyIntoleranceManifestationSchema = CodeableConceptSchema.refine(
  (value) => (value.coding?.length ?? 0) > 0 || Boolean(value.text),
  "AllergyIntolerance.reaction.manifestation needs a coding or a text",
);

export const AllergyIntoleranceReactionSchema = z.object({
  substance: CodeableConceptSchema.optional(),
  manifestation: z.array(AllergyIntoleranceManifestationSchema).min(1),
  description: z.string().optional(),
  onset: z.string().optional(),
  severity: z.enum(["mild", "moderate", "severe"]).optional(),
  exposureRoute: CodeableConceptSchema.optional(),
  note: z.array(AllergyIntoleranceNoteSchema).optional(),
});

export const AllergyIntolerancePatchOperationSchema = z.object({
  op: z.literal("replace"),
  path: z.string().min(1),
  value: z.unknown(),
});

export const AllergyIntolerancePatchSchema = z
  .array(AllergyIntolerancePatchOperationSchema)
  .min(1);

export const AllergyIntoleranceSearchParamsSchema = z
  .object({
    patient: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.patient) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Use one AllergyIntolerance search mode: patient, or patient+code",
        path: ["patient"],
      });
    }
  });

export const AllergyIntoleranceBaseSchema = z.object({
  resourceType: z.literal("AllergyIntolerance"),
  identifier: z.array(AllergyIntoleranceIdentifierSchema).optional(),
  clinicalStatus: AllergyIntoleranceRequiredCodeableConceptSchema.optional(),
  verificationStatus: AllergyIntoleranceRequiredCodeableConceptSchema.optional(),
  type: z.enum(["allergy", "intolerance"]).optional(),
  category: z
    .array(z.enum(["food", "medication", "environment", "biologic"]))
    .min(1)
    .optional(),
  criticality: z.enum(["low", "high", "unable-to-assess"]).optional(),
  code: AllergyIntoleranceRequiredCodeableConceptSchema,
  patient: ReferenceSchema,
  encounter: ReferenceSchema.optional(),
  onsetDateTime: z.string().optional(),
  onsetAge: AllergyIntoleranceQuantitySchema.optional(),
  onsetPeriod: PeriodSchema.optional(),
  onsetRange: AllergyIntoleranceRangeSchema.optional(),
  onsetString: z.string().optional(),
  recordedDate: z.string().optional(),
  recorder: ReferenceSchema.optional(),
  asserter: ReferenceSchema.optional(),
  lastOccurrence: z.string().optional(),
  note: z.array(AllergyIntoleranceNoteSchema).optional(),
  reaction: z.array(AllergyIntoleranceReactionSchema).optional(),
});

// The SATUSEHAT anamnesis guides (Rawat Jalan, IGD, Rawat Inap) mark category, encounter, and
// recorder as mandatory for Riwayat Alergi. Stored resources are still read leniently.
export const AllergyIntoleranceCreateSchema = AllergyIntoleranceBaseSchema.superRefine(
  (value, ctx) => {
    const required = [
      ["category", value.category?.length],
      ["encounter", value.encounter],
      ["recorder", value.recorder],
    ] as const;

    required.forEach(([field, present]) => {
      if (!present) {
        ctx.addIssue({
          code: "custom",
          message: `AllergyIntolerance.${field} is required by SATUSEHAT`,
          path: [field],
        });
      }
    });
  },
);

export const AllergyIntoleranceSchema = AllergyIntoleranceBaseSchema.extend({
  id: z.string().min(1),
  meta: MetaSchema.optional(),
});

export const AllergyIntoleranceUpdateParamsSchema = z.object({
  id: z.string().min(1),
});

export const AllergyIntoleranceBundleSchema = createSearchBundleSchema(AllergyIntoleranceSchema);

export type AllergyIntoleranceIdentifier = z.infer<typeof AllergyIntoleranceIdentifierSchema>;
export type AllergyIntoleranceCoding = z.infer<typeof AllergyIntoleranceCodingSchema>;
export type AllergyIntoleranceQuantity = z.infer<typeof AllergyIntoleranceQuantitySchema>;
export type AllergyIntoleranceRange = z.infer<typeof AllergyIntoleranceRangeSchema>;
export type AllergyIntoleranceNote = z.infer<typeof AllergyIntoleranceNoteSchema>;
export type AllergyIntoleranceReaction = z.infer<typeof AllergyIntoleranceReactionSchema>;
export type AllergyIntolerancePatchOperation = z.infer<typeof AllergyIntolerancePatchOperationSchema>;
export type AllergyIntolerancePatchInput = z.infer<typeof AllergyIntolerancePatchSchema>;
export type AllergyIntolerance = z.infer<typeof AllergyIntoleranceSchema>;
export type AllergyIntoleranceCreateInput = z.infer<typeof AllergyIntoleranceCreateSchema>;
export type AllergyIntoleranceSearchParams = z.infer<typeof AllergyIntoleranceSearchParamsSchema>;
export type AllergyIntoleranceSearchResponse = z.infer<typeof AllergyIntoleranceBundleSchema>;

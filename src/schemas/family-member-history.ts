import { z } from "zod";

import {
  CodeableConceptSchema,
  createSearchBundleSchema,
  IdentifierSchema,
  MetaSchema,
  PeriodSchema,
  ReferenceSchema,
} from "./common";

export const FamilyMemberHistoryStatusSchema = z.enum([
  "partial",
  "completed",
  "entered-in-error",
  "health-unknown",
]);

export const FamilyMemberHistoryCodingSchema = z.object({
  system: z.string().min(1),
  code: z.string().min(1),
  display: z.string().optional(),
});

export const FamilyMemberHistoryRequiredCodeableConceptSchema = CodeableConceptSchema.extend({
  coding: z.array(FamilyMemberHistoryCodingSchema).min(1),
});

export const FamilyMemberHistoryAgeSchema = z.object({
  value: z.number(),
  unit: z.string().optional(),
  system: z.string().optional(),
  code: z.string().optional(),
});

export const FamilyMemberHistoryRangeSchema = z.object({
  low: FamilyMemberHistoryAgeSchema.optional(),
  high: FamilyMemberHistoryAgeSchema.optional(),
});

export const FamilyMemberHistoryNoteSchema = z.object({
  authorReference: ReferenceSchema.optional(),
  authorString: z.string().min(1).optional(),
  time: z.string().optional(),
  text: z.string().min(1),
});

export const FamilyMemberHistoryConditionSchema = z.object({
  code: FamilyMemberHistoryRequiredCodeableConceptSchema,
  outcome: CodeableConceptSchema.optional(),
  contributedToDeath: z.boolean().optional(),
  onsetAge: FamilyMemberHistoryAgeSchema.optional(),
  onsetRange: FamilyMemberHistoryRangeSchema.optional(),
  onsetPeriod: PeriodSchema.optional(),
  onsetString: z.string().optional(),
  note: z.array(FamilyMemberHistoryNoteSchema).optional(),
});

export const FamilyMemberHistoryPatchOperationSchema = z.object({
  op: z.literal("replace"),
  path: z.string().min(1),
  value: z.unknown(),
});

export const FamilyMemberHistoryPatchSchema = z
  .array(FamilyMemberHistoryPatchOperationSchema)
  .min(1);

export const FamilyMemberHistorySearchParamsSchema = z.object({
  patient: z.string().min(1),
});

export const FamilyMemberHistoryBaseSchema = z.object({
  resourceType: z.literal("FamilyMemberHistory"),
  identifier: z.array(IdentifierSchema).optional(),
  status: FamilyMemberHistoryStatusSchema,
  dataAbsentReason: CodeableConceptSchema.optional(),
  patient: ReferenceSchema,
  date: z.string().optional(),
  name: z.string().optional(),
  relationship: FamilyMemberHistoryRequiredCodeableConceptSchema,
  sex: CodeableConceptSchema.optional(),
  bornDate: z.string().optional(),
  bornString: z.string().optional(),
  ageAge: FamilyMemberHistoryAgeSchema.optional(),
  ageString: z.string().optional(),
  estimatedAge: z.boolean().optional(),
  deceasedBoolean: z.boolean().optional(),
  deceasedAge: FamilyMemberHistoryAgeSchema.optional(),
  deceasedRange: FamilyMemberHistoryRangeSchema.optional(),
  deceasedDate: z.string().optional(),
  deceasedString: z.string().optional(),
  reasonCode: z.array(CodeableConceptSchema).optional(),
  reasonReference: z.array(ReferenceSchema).optional(),
  note: z.array(FamilyMemberHistoryNoteSchema).optional(),
  condition: z.array(FamilyMemberHistoryConditionSchema).optional(),
});

export const FamilyMemberHistoryCreateSchema = FamilyMemberHistoryBaseSchema.superRefine(
  (value, ctx) => {
    // SATUSEHAT requires FamilyMemberHistory.condition.code (Riwayat Penyakit Keluarga).
    if (!value.condition?.length) {
      ctx.addIssue({
        code: "custom",
        message: "FamilyMemberHistory requires at least one condition",
        path: ["condition"],
      });
    }
  },
);

export const FamilyMemberHistorySchema = FamilyMemberHistoryBaseSchema.extend({
  id: z.string().min(1),
  meta: MetaSchema.optional(),
});

export const FamilyMemberHistoryUpdateParamsSchema = z.object({
  id: z.string().min(1),
});

export const FamilyMemberHistoryBundleSchema = createSearchBundleSchema(FamilyMemberHistorySchema);

export type FamilyMemberHistoryStatus = z.infer<typeof FamilyMemberHistoryStatusSchema>;
export type FamilyMemberHistoryCoding = z.infer<typeof FamilyMemberHistoryCodingSchema>;
export type FamilyMemberHistoryAge = z.infer<typeof FamilyMemberHistoryAgeSchema>;
export type FamilyMemberHistoryRange = z.infer<typeof FamilyMemberHistoryRangeSchema>;
export type FamilyMemberHistoryNote = z.infer<typeof FamilyMemberHistoryNoteSchema>;
export type FamilyMemberHistoryCondition = z.infer<typeof FamilyMemberHistoryConditionSchema>;
export type FamilyMemberHistoryPatchOperation = z.infer<
  typeof FamilyMemberHistoryPatchOperationSchema
>;
export type FamilyMemberHistoryPatchInput = z.infer<typeof FamilyMemberHistoryPatchSchema>;
export type FamilyMemberHistory = z.infer<typeof FamilyMemberHistorySchema>;
export type FamilyMemberHistoryCreateInput = z.infer<typeof FamilyMemberHistoryCreateSchema>;
export type FamilyMemberHistorySearchParams = z.infer<typeof FamilyMemberHistorySearchParamsSchema>;
export type FamilyMemberHistorySearchResponse = z.infer<typeof FamilyMemberHistoryBundleSchema>;

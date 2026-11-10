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

export const MedicationStatementIdentifierSchema = IdentifierSchema.extend({
  value: z.string().min(1),
});

export const MedicationStatementStatusSchema = z.enum([
  "active",
  "completed",
  "entered-in-error",
  "intended",
  "stopped",
  "on-hold",
  "unknown",
  "not-taken",
]);

export const MedicationStatementNoteSchema = z.object({
  authorReference: ReferenceSchema.optional(),
  authorString: z.string().min(1).optional(),
  time: z.string().optional(),
  text: z.string().min(1),
});

export const MedicationStatementDosageSchema = z
  .object({
    sequence: z.number().int().positive().optional(),
    text: z.string().min(1).optional(),
    additionalInstruction: z.array(CodeableConceptSchema).optional(),
    patientInstruction: z.string().min(1).optional(),
    timing: z.unknown().optional(),
    asNeededBoolean: z.boolean().optional(),
    asNeededCodeableConcept: CodeableConceptSchema.optional(),
    site: CodeableConceptSchema.optional(),
    route: CodeableConceptSchema.optional(),
    method: CodeableConceptSchema.optional(),
    doseAndRate: z.array(z.unknown()).optional(),
    maxDosePerPeriod: z.unknown().optional(),
    maxDosePerAdministration: z.unknown().optional(),
    maxDosePerLifetime: z.unknown().optional(),
  })
  .passthrough();

export const MedicationStatementPatchOperationSchema = z.object({
  op: z.literal("replace"),
  path: z.string().min(1),
  value: z.unknown(),
});

export const MedicationStatementPatchSchema = z
  .array(MedicationStatementPatchOperationSchema)
  .min(1);

export const MedicationStatementSearchParamsSchema = z
  .object({
    subject: z.string().min(1).optional(),
    context: z.guid().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.subject || value.context) {
      return;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Use at least one MedicationStatement search parameter: subject or context",
      path: ["subject"],
    });
  });

const MedicationStatementBaseObjectSchema = z.object({
  resourceType: z.literal("MedicationStatement"),
  identifier: z.array(MedicationStatementIdentifierSchema).optional(),
  basedOn: z.array(ReferenceSchema).optional(),
  partOf: z.array(ReferenceSchema).optional(),
  status: MedicationStatementStatusSchema,
  category: CodeableConceptSchema.optional(),
  medicationCodeableConcept: CodeableConceptSchema.optional(),
  medicationReference: ReferenceSchema.optional(),
  subject: ReferenceSchema,
  context: ReferenceSchema.optional(),
  effectiveDateTime: z.string().optional(),
  effectivePeriod: PeriodSchema.optional(),
  dateAsserted: z.string().optional(),
  informationSource: ReferenceSchema.optional(),
  derivedFrom: z.array(ReferenceSchema).optional(),
  reasonCode: z.array(CodeableConceptSchema).optional(),
  reasonReference: z.array(ReferenceSchema).optional(),
  note: z.array(MedicationStatementNoteSchema).optional(),
  dosage: z.array(MedicationStatementDosageSchema).optional(),
});

function validateMedicationStatementInvariants(
  value: z.infer<typeof MedicationStatementBaseObjectSchema>,
  ctx: z.RefinementCtx,
) {
  const hasMedicationCodeableConcept = Boolean(value.medicationCodeableConcept);
  const hasMedicationReference = Boolean(value.medicationReference);

  if (!hasMedicationCodeableConcept && !hasMedicationReference) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "MedicationStatement requires either medicationCodeableConcept or medicationReference",
      path: ["medicationReference"],
    });
  }

  if (hasMedicationCodeableConcept && hasMedicationReference) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "MedicationStatement accepts only one of medicationCodeableConcept or medicationReference",
      path: ["medicationReference"],
    });
  }

  const hasEffectiveDateTime = Boolean(value.effectiveDateTime);
  const hasEffectivePeriod = Boolean(value.effectivePeriod);

  if (hasEffectiveDateTime && hasEffectivePeriod) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "MedicationStatement accepts only one of effectiveDateTime or effectivePeriod",
      path: ["effectivePeriod"],
    });
  }
}

export const MedicationStatementCreateSchema =
  MedicationStatementBaseObjectSchema.superRefine(
    validateMedicationStatementInvariants,
  );

export const MedicationStatementSchema = MedicationStatementBaseObjectSchema.extend({
  id: z.string().min(1),
  meta: MetaSchema.optional(),
}).superRefine(validateMedicationStatementInvariants);

export const MedicationStatementUpdateParamsSchema = z.object({
  id: z.string().min(1),
});

export const MedicationStatementBundleSchema = z.object({
  resourceType: z.literal("Bundle"),
  type: z.string().optional(),
  total: z.number().optional(),
  link: z.array(BundleLinkSchema).optional(),
  entry: z.array(BundleEntrySchema(MedicationStatementSchema)).optional(),
});

export type MedicationStatementIdentifier = z.infer<
  typeof MedicationStatementIdentifierSchema
>;
export type MedicationStatementStatus = z.infer<
  typeof MedicationStatementStatusSchema
>;
export type MedicationStatementNote = z.infer<
  typeof MedicationStatementNoteSchema
>;
export type MedicationStatementDosage = z.infer<
  typeof MedicationStatementDosageSchema
>;
export type MedicationStatementPatchOperation = z.infer<
  typeof MedicationStatementPatchOperationSchema
>;
export type MedicationStatementPatchInput = z.infer<
  typeof MedicationStatementPatchSchema
>;
export type MedicationStatement = z.infer<typeof MedicationStatementSchema>;
export type MedicationStatementCreateInput = z.infer<
  typeof MedicationStatementCreateSchema
>;
export type MedicationStatementSearchParams = z.infer<
  typeof MedicationStatementSearchParamsSchema
>;
export type MedicationStatementSearchResponse = z.infer<
  typeof MedicationStatementBundleSchema
>;

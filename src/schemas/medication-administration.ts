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

export const MedicationAdministrationIdentifierSchema = IdentifierSchema.extend({
  value: z.string().min(1),
});

export const MedicationAdministrationStatusSchema = z.enum([
  "in-progress",
  "not-done",
  "on-hold",
  "completed",
  "entered-in-error",
  "stopped",
  "unknown",
]);

export const MedicationAdministrationQuantitySchema = z.object({
  value: z.union([z.number(), z.string()]),
  unit: z.string().optional(),
  system: z.string().optional(),
  code: z.string().optional(),
});

export const MedicationAdministrationRatioSchema = z.object({
  numerator: MedicationAdministrationQuantitySchema.optional(),
  denominator: MedicationAdministrationQuantitySchema.optional(),
});

export const MedicationAdministrationPerformerSchema = z.object({
  function: CodeableConceptSchema.optional(),
  actor: ReferenceSchema,
});

export const MedicationAdministrationNoteSchema = z.object({
  authorReference: ReferenceSchema.optional(),
  authorString: z.string().min(1).optional(),
  time: z.string().optional(),
  text: z.string().min(1),
});

export const MedicationAdministrationDosageSchema = z.object({
  text: z.string().min(1).optional(),
  site: CodeableConceptSchema.optional(),
  route: CodeableConceptSchema.optional(),
  method: CodeableConceptSchema.optional(),
  dose: MedicationAdministrationQuantitySchema.optional(),
  rateRatio: MedicationAdministrationRatioSchema.optional(),
  rateQuantity: MedicationAdministrationQuantitySchema.optional(),
});

export const MedicationAdministrationPatchOperationSchema = z.object({
  op: z.literal("replace"),
  path: z.string().min(1),
  value: z.unknown(),
});

export const MedicationAdministrationPatchSchema = z
  .array(MedicationAdministrationPatchOperationSchema)
  .min(1);

export const MedicationAdministrationSearchParamsSchema = z
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
        "Use at least one MedicationAdministration search parameter: subject or context",
      path: ["subject"],
    });
  });

const MedicationAdministrationBaseObjectSchema = z.object({
  resourceType: z.literal("MedicationAdministration"),
  identifier: z.array(MedicationAdministrationIdentifierSchema).optional(),
  instantiates: z.array(z.string().min(1)).optional(),
  partOf: z.array(ReferenceSchema).optional(),
  status: MedicationAdministrationStatusSchema,
  statusReason: z.array(CodeableConceptSchema).optional(),
  category: CodeableConceptSchema.optional(),
  medicationCodeableConcept: CodeableConceptSchema.optional(),
  medicationReference: ReferenceSchema.optional(),
  subject: ReferenceSchema,
  context: ReferenceSchema.optional(),
  supportingInformation: z.array(ReferenceSchema).optional(),
  effectiveDateTime: z.string().optional(),
  effectivePeriod: PeriodSchema.optional(),
  performer: z.array(MedicationAdministrationPerformerSchema).optional(),
  reasonCode: z.array(CodeableConceptSchema).optional(),
  reasonReference: z.array(ReferenceSchema).optional(),
  request: ReferenceSchema.optional(),
  device: z.array(ReferenceSchema).optional(),
  note: z.array(MedicationAdministrationNoteSchema).optional(),
  dosage: MedicationAdministrationDosageSchema.optional(),
  eventHistory: z.array(ReferenceSchema).optional(),
});

function validateMedicationAdministrationInvariants(
  value: z.infer<typeof MedicationAdministrationBaseObjectSchema>,
  ctx: z.RefinementCtx,
) {
  const hasMedicationCodeableConcept = Boolean(value.medicationCodeableConcept);
  const hasMedicationReference = Boolean(value.medicationReference);

  if (!hasMedicationCodeableConcept && !hasMedicationReference) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "MedicationAdministration requires either medicationCodeableConcept or medicationReference",
      path: ["medicationReference"],
    });
  }

  if (hasMedicationCodeableConcept && hasMedicationReference) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "MedicationAdministration accepts only one of medicationCodeableConcept or medicationReference",
      path: ["medicationReference"],
    });
  }

  const hasEffectiveDateTime = Boolean(value.effectiveDateTime);
  const hasEffectivePeriod = Boolean(value.effectivePeriod);

  if (!hasEffectiveDateTime && !hasEffectivePeriod) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "MedicationAdministration requires either effectiveDateTime or effectivePeriod",
      path: ["effectiveDateTime"],
    });
  }

  if (hasEffectiveDateTime && hasEffectivePeriod) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "MedicationAdministration accepts only one of effectiveDateTime or effectivePeriod",
      path: ["effectivePeriod"],
    });
  }
}

export const MedicationAdministrationCreateSchema =
  MedicationAdministrationBaseObjectSchema.superRefine(
    validateMedicationAdministrationInvariants,
  );

export const MedicationAdministrationSchema = MedicationAdministrationBaseObjectSchema.extend({
  id: z.string().min(1),
  meta: MetaSchema.optional(),
}).superRefine(validateMedicationAdministrationInvariants);

export const MedicationAdministrationUpdateParamsSchema = z.object({
  id: z.string().min(1),
});

export const MedicationAdministrationBundleSchema = z.object({
  resourceType: z.literal("Bundle"),
  type: z.string().optional(),
  total: z.number().optional(),
  link: z.array(BundleLinkSchema).optional(),
  entry: z.array(BundleEntrySchema(MedicationAdministrationSchema)).optional(),
});

export type MedicationAdministrationIdentifier = z.infer<
  typeof MedicationAdministrationIdentifierSchema
>;
export type MedicationAdministrationStatus = z.infer<
  typeof MedicationAdministrationStatusSchema
>;
export type MedicationAdministrationQuantity = z.infer<
  typeof MedicationAdministrationQuantitySchema
>;
export type MedicationAdministrationRatio = z.infer<
  typeof MedicationAdministrationRatioSchema
>;
export type MedicationAdministrationPerformer = z.infer<
  typeof MedicationAdministrationPerformerSchema
>;
export type MedicationAdministrationNote = z.infer<
  typeof MedicationAdministrationNoteSchema
>;
export type MedicationAdministrationDosage = z.infer<
  typeof MedicationAdministrationDosageSchema
>;
export type MedicationAdministrationPatchOperation = z.infer<
  typeof MedicationAdministrationPatchOperationSchema
>;
export type MedicationAdministrationPatchInput = z.infer<
  typeof MedicationAdministrationPatchSchema
>;
export type MedicationAdministration = z.infer<typeof MedicationAdministrationSchema>;
export type MedicationAdministrationCreateInput = z.infer<
  typeof MedicationAdministrationCreateSchema
>;
export type MedicationAdministrationSearchParams = z.infer<
  typeof MedicationAdministrationSearchParamsSchema
>;
export type MedicationAdministrationSearchResponse = z.infer<
  typeof MedicationAdministrationBundleSchema
>;

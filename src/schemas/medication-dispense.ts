import { z } from "zod";

import {
  BundleEntrySchema,
  BundleLinkSchema,
  CodeableConceptSchema,
  IdentifierSchema,
  MetaSchema,
  ReferenceSchema,
} from "./common";

export const MedicationDispenseIdentifierSchema = IdentifierSchema.extend({
  value: z.string().min(1),
});

export const MedicationDispenseStatusSchema = z.enum([
  "preparation",
  "in-progress",
  "cancelled",
  "on-hold",
  "completed",
  "entered-in-error",
  "stopped",
  "declined",
  "unknown",
]);

export const MedicationDispensePerformerSchema = z.object({
  function: CodeableConceptSchema.optional(),
  actor: ReferenceSchema,
});

export const MedicationDispenseQuantitySchema = z.object({
  value: z.union([z.number(), z.string()]),
  unit: z.string().optional(),
  system: z.string().optional(),
  code: z.string().optional(),
});

export const MedicationDispenseSubstitutionSchema = z.object({
  wasSubstituted: z.boolean(),
  type: CodeableConceptSchema.optional(),
  reason: z.array(CodeableConceptSchema).optional(),
  responsibleParty: z.array(ReferenceSchema).optional(),
});

export const MedicationDispensePatchOperationSchema = z.object({
  op: z.literal("replace"),
  path: z.string().min(1),
  value: z.unknown(),
});

export const MedicationDispensePatchSchema = z
  .array(MedicationDispensePatchOperationSchema)
  .min(1);

export const MedicationDispenseSearchParamsSchema = z
  .object({
    subject: z.string().min(1).optional(),
    context: z.guid().optional(),
    prescription: z.guid().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.subject && !value.context && !value.prescription) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Use at least one MedicationDispense search parameter: subject, context, or prescription",
        path: ["subject"],
      });
    }

    if ((value.context || value.prescription) && !value.subject) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "MedicationDispense search with context or prescription also requires subject",
        path: ["subject"],
      });
    }
  });

const MedicationDispenseBaseObjectSchema = z.object({
  resourceType: z.literal("MedicationDispense"),
  identifier: z.array(MedicationDispenseIdentifierSchema).optional(),
  partOf: z.array(ReferenceSchema).optional(),
  status: MedicationDispenseStatusSchema,
  category: CodeableConceptSchema.optional(),
  medicationCodeableConcept: CodeableConceptSchema.optional(),
  medicationReference: ReferenceSchema.optional(),
  subject: ReferenceSchema,
  context: ReferenceSchema.optional(),
  performer: z.array(MedicationDispensePerformerSchema).optional(),
  location: ReferenceSchema.optional(),
  authorizingPrescription: z.array(ReferenceSchema).optional(),
  type: CodeableConceptSchema.optional(),
  quantity: MedicationDispenseQuantitySchema.optional(),
  daysSupply: MedicationDispenseQuantitySchema.optional(),
  whenPrepared: z.string().optional(),
  whenHandedOver: z.string().optional(),
  destination: ReferenceSchema.optional(),
  receiver: z.array(ReferenceSchema).optional(),
  note: z.array(z.object({ text: z.string().min(1) }).passthrough()).optional(),
  dosageInstruction: z.array(z.unknown()).optional(),
  substitution: MedicationDispenseSubstitutionSchema.optional(),
});

function validateMedicationDispenseInvariants(
  value: z.infer<typeof MedicationDispenseBaseObjectSchema>,
  ctx: z.RefinementCtx,
) {
  const hasMedicationCodeableConcept = Boolean(value.medicationCodeableConcept);
  const hasMedicationReference = Boolean(value.medicationReference);

  if (!hasMedicationCodeableConcept && !hasMedicationReference) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "MedicationDispense requires either medicationCodeableConcept or medicationReference",
      path: ["medicationReference"],
    });
  }

  if (hasMedicationCodeableConcept && hasMedicationReference) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "MedicationDispense accepts only one of medicationCodeableConcept or medicationReference",
      path: ["medicationReference"],
    });
  }
}

export const MedicationDispenseCreateSchema =
  MedicationDispenseBaseObjectSchema.superRefine(
    validateMedicationDispenseInvariants,
  );

export const MedicationDispenseSchema = MedicationDispenseBaseObjectSchema.extend({
  id: z.string().min(1),
  meta: MetaSchema.optional(),
}).superRefine(validateMedicationDispenseInvariants);

export const MedicationDispenseUpdateParamsSchema = z.object({
  id: z.string().min(1),
});

export const MedicationDispenseBundleSchema = z.object({
  resourceType: z.literal("Bundle"),
  type: z.string().optional(),
  total: z.number().optional(),
  link: z.array(BundleLinkSchema).optional(),
  entry: z.array(BundleEntrySchema(MedicationDispenseSchema)).optional(),
});

export type MedicationDispenseIdentifier = z.infer<
  typeof MedicationDispenseIdentifierSchema
>;
export type MedicationDispenseStatus = z.infer<
  typeof MedicationDispenseStatusSchema
>;
export type MedicationDispensePerformer = z.infer<
  typeof MedicationDispensePerformerSchema
>;
export type MedicationDispenseSubstitution = z.infer<
  typeof MedicationDispenseSubstitutionSchema
>;
export type MedicationDispensePatchOperation = z.infer<
  typeof MedicationDispensePatchOperationSchema
>;
export type MedicationDispensePatchInput = z.infer<
  typeof MedicationDispensePatchSchema
>;
export type MedicationDispense = z.infer<typeof MedicationDispenseSchema>;
export type MedicationDispenseCreateInput = z.infer<
  typeof MedicationDispenseCreateSchema
>;
export type MedicationDispenseSearchParams = z.infer<
  typeof MedicationDispenseSearchParamsSchema
>;
export type MedicationDispenseSearchResponse = z.infer<
  typeof MedicationDispenseBundleSchema
>;

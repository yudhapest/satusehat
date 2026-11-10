import { z } from "zod";

import {
  CodeableConceptSchema,
  ContactPointSchema,
  createSearchBundleSchema,
  IdentifierSchema,
  MetaSchema,
  PeriodSchema,
  ReferenceSchema,
} from "./common";

export const SpecimenIdentifierSchema = IdentifierSchema.extend({
  system: z
    .string()
    .regex(
      /^http:\/\/sys-ids\.kemkes\.go\.id\/specimen\/.+$/,
      "Specimen identifier.system must use http://sys-ids.kemkes.go.id/specimen/{organization-ihs-number}",
    ),
  value: z.string().min(1),
});

export const SpecimenStatusSchema = z.enum([
  "available",
  "unavailable",
  "unsatisfactory",
  "entered-in-error",
]);

export const SpecimenCodingSchema = z.object({
  system: z.string().min(1),
  code: z.string().min(1),
  display: z.string().optional(),
});

export const SpecimenRequiredCodeableConceptSchema = CodeableConceptSchema.extend({
  coding: z.array(SpecimenCodingSchema).min(1),
});

export const SpecimenQuantitySchema = z.object({
  value: z.number(),
  unit: z.string().optional(),
  system: z.string().optional(),
  code: z.string().optional(),
});

export const SpecimenNoteSchema = z.object({
  authorReference: ReferenceSchema.optional(),
  authorString: z.string().min(1).optional(),
  time: z.string().optional(),
  text: z.string().min(1),
});

export const SpecimenContactDetailSchema = z.object({
  name: z.string().min(1).optional(),
  telecom: z.array(ContactPointSchema).optional(),
});

export const SpecimenCollectionSchema = z.object({
  collector: ReferenceSchema.optional(),
  collectedDateTime: z.string().optional(),
  collectedPeriod: PeriodSchema.optional(),
  duration: SpecimenQuantitySchema.optional(),
  quantity: SpecimenQuantitySchema.optional(),
  method: CodeableConceptSchema.optional(),
  bodySite: CodeableConceptSchema.optional(),
  fastingStatusCodeableConcept: CodeableConceptSchema.optional(),
  fastingStatusDuration: SpecimenQuantitySchema.optional(),
});

export const SpecimenProcessingSchema = z.object({
  description: z.string().min(1).optional(),
  procedure: CodeableConceptSchema.optional(),
  additive: z.array(ReferenceSchema).optional(),
  timeDateTime: z.string().optional(),
  timePeriod: PeriodSchema.optional(),
});

export const SpecimenContainerSchema = z.object({
  identifier: z.array(IdentifierSchema).optional(),
  description: z.string().min(1).optional(),
  type: CodeableConceptSchema.optional(),
  capacity: SpecimenQuantitySchema.optional(),
  specimenQuantity: SpecimenQuantitySchema.optional(),
  additiveCodeableConcept: CodeableConceptSchema.optional(),
  additiveReference: ReferenceSchema.optional(),
});

export const SpecimenExtensionSchema = z.object({
  url: z.string().min(1),
  valueDateTime: z.string().optional(),
  valueContactDetail: SpecimenContactDetailSchema.optional(),
  valueReference: ReferenceSchema.optional(),
});

export const SpecimenPatchOperationSchema = z.object({
  op: z.literal("replace"),
  path: z.string().min(1),
  value: z.unknown(),
});

export const SpecimenPatchSchema = z.array(SpecimenPatchOperationSchema).min(1);

export const SpecimenSearchParamsSchema = z
  .object({
    subject: z.string().min(1).optional(),
    collector: z.string().min(1).optional(),
    collected: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Specimen collected must use YYYY-MM-DD").optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.subject) {
      if (value.collector || value.collected) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Specimen search with "collector" or "collected" also requires "subject"',
          path: ["subject"],
        });
        return;
      }

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Use one Specimen search mode: subject, subject with "collector", or subject with "collected"',
        path: ["subject"],
      });
      return;
    }

    if (value.collector && value.collected) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Use only one Specimen refinement parameter: "collector" or "collected"',
        path: ["collector"],
      });
    }
  });

export const SpecimenBaseSchema = z.object({
  resourceType: z.literal("Specimen"),
  identifier: z.array(SpecimenIdentifierSchema).optional(),
  accessionIdentifier: IdentifierSchema.optional(),
  status: SpecimenStatusSchema,
  type: SpecimenRequiredCodeableConceptSchema,
  subject: ReferenceSchema,
  receivedTime: z.string().optional(),
  parent: z.array(ReferenceSchema).optional(),
  request: z.array(ReferenceSchema).optional(),
  collection: SpecimenCollectionSchema.optional(),
  processing: z.array(SpecimenProcessingSchema).optional(),
  container: z.array(SpecimenContainerSchema).optional(),
  condition: z.array(CodeableConceptSchema).optional(),
  note: z.array(SpecimenNoteSchema).optional(),
  extension: z.array(SpecimenExtensionSchema).optional(),
});

export const SpecimenCreateSchema = SpecimenBaseSchema;

export const SpecimenSchema = SpecimenBaseSchema.extend({
  id: z.string().min(1),
  meta: MetaSchema.optional(),
});

export const SpecimenUpdateParamsSchema = z.object({
  id: z.string().min(1),
});

export const SpecimenBundleSchema = createSearchBundleSchema(SpecimenSchema);

export type SpecimenIdentifier = z.infer<typeof SpecimenIdentifierSchema>;
export type SpecimenStatus = z.infer<typeof SpecimenStatusSchema>;
export type SpecimenCoding = z.infer<typeof SpecimenCodingSchema>;
export type SpecimenQuantity = z.infer<typeof SpecimenQuantitySchema>;
export type SpecimenNote = z.infer<typeof SpecimenNoteSchema>;
export type SpecimenContactDetail = z.infer<typeof SpecimenContactDetailSchema>;
export type SpecimenCollection = z.infer<typeof SpecimenCollectionSchema>;
export type SpecimenProcessing = z.infer<typeof SpecimenProcessingSchema>;
export type SpecimenContainer = z.infer<typeof SpecimenContainerSchema>;
export type SpecimenExtension = z.infer<typeof SpecimenExtensionSchema>;
export type SpecimenPatchOperation = z.infer<typeof SpecimenPatchOperationSchema>;
export type SpecimenPatchInput = z.infer<typeof SpecimenPatchSchema>;
export type Specimen = z.infer<typeof SpecimenSchema>;
export type SpecimenCreateInput = z.infer<typeof SpecimenCreateSchema>;
export type SpecimenSearchParams = z.infer<typeof SpecimenSearchParamsSchema>;
export type SpecimenSearchResponse = z.infer<typeof SpecimenBundleSchema>;

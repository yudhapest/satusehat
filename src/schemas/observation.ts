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

export const ObservationIdentifierSchema = IdentifierSchema.extend({
  system: z
    .string()
    .regex(
      /^http:\/\/sys-ids\.kemkes\.go\.id\/observation\/.+$/,
      "Observation identifier.system must use http://sys-ids.kemkes.go.id/observation/{organization-ihs-number}",
    ),
  value: z.string().min(1),
});

export const ObservationStatusSchema = z.enum([
  "registered",
  "preliminary",
  "final",
  "amended",
  "corrected",
  "cancelled",
  "entered-in-error",
  "unknown",
]);

export const ObservationCodingSchema = z.object({
  system: z.string().min(1),
  code: z.string().min(1),
  display: z.string().optional(),
});

export const ObservationRequiredCodeableConceptSchema = CodeableConceptSchema.extend({
  coding: z.array(ObservationCodingSchema).min(1),
});

export const ObservationQuantitySchema = z.object({
  value: z.number(),
  unit: z.string().optional(),
  system: z.string().optional(),
  code: z.string().optional(),
});

export const ObservationRangeSchema = z.object({
  low: ObservationQuantitySchema.optional(),
  high: ObservationQuantitySchema.optional(),
});

export const ObservationReferenceRangeSchema = z.object({
  low: ObservationQuantitySchema.optional(),
  high: ObservationQuantitySchema.optional(),
  type: CodeableConceptSchema.optional(),
  appliesTo: z.array(CodeableConceptSchema).optional(),
  age: ObservationRangeSchema.optional(),
  text: z.string().optional(),
});

export const ObservationComponentSchema = z.object({
  code: ObservationRequiredCodeableConceptSchema,
  valueQuantity: ObservationQuantitySchema.optional(),
  valueCodeableConcept: CodeableConceptSchema.optional(),
  valueString: z.string().optional(),
  valueBoolean: z.boolean().optional(),
  valueInteger: z.number().int().optional(),
  interpretation: z.array(CodeableConceptSchema).optional(),
  referenceRange: z.array(ObservationReferenceRangeSchema).optional(),
});

export const ObservationNoteSchema = z.object({
  authorReference: ReferenceSchema.optional(),
  authorString: z.string().min(1).optional(),
  time: z.string().optional(),
  text: z.string().min(1),
});

export const ObservationPatchOperationSchema = z.object({
  op: z.literal("replace"),
  path: z.string().min(1),
  value: z.unknown(),
});

export const ObservationPatchSchema = z.array(ObservationPatchOperationSchema).min(1);

export const ObservationSearchParamsSchema = z
  .object({
    subject: z.string().min(1).optional(),
    encounter: z.guid().optional(),
    "based-on": z.guid().optional(),
  })
  .superRefine((value, ctx) => {
    const hasSubject = Boolean(value.subject);
    const hasEncounter = Boolean(value.encounter);
    const hasBasedOn = Boolean(value["based-on"]);

    if (hasBasedOn && !hasSubject) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Observation search with "based-on" also requires "subject"',
        path: ["subject"],
      });
      return;
    }

    if (hasSubject || hasEncounter) {
      return;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Use one Observation search mode: subject and/or encounter, or subject with "based-on"',
      path: ["subject"],
    });
  });

export const ObservationBaseSchema = z.object({
  resourceType: z.literal("Observation"),
  identifier: z.array(ObservationIdentifierSchema).optional(),
  basedOn: z.array(ReferenceSchema).optional(),
  status: ObservationStatusSchema,
  category: z.array(CodeableConceptSchema).optional(),
  code: ObservationRequiredCodeableConceptSchema,
  subject: ReferenceSchema,
  encounter: ReferenceSchema,
  effectiveDateTime: z.string().optional(),
  effectivePeriod: PeriodSchema.optional(),
  effectiveTiming: z.unknown().optional(),
  effectiveInstant: z.string().optional(),
  issued: z.string().optional(),
  performer: z.array(ReferenceSchema).optional(),
  valueQuantity: ObservationQuantitySchema.optional(),
  valueCodeableConcept: CodeableConceptSchema.optional(),
  valueString: z.string().optional(),
  valueBoolean: z.boolean().optional(),
  valueInteger: z.number().int().optional(),
  valueRange: ObservationRangeSchema.optional(),
  dataAbsentReason: CodeableConceptSchema.optional(),
  interpretation: z.array(CodeableConceptSchema).optional(),
  note: z.array(ObservationNoteSchema).optional(),
  bodySite: CodeableConceptSchema.optional(),
  method: CodeableConceptSchema.optional(),
  specimen: ReferenceSchema.optional(),
  device: ReferenceSchema.optional(),
  referenceRange: z.array(ObservationReferenceRangeSchema).optional(),
  hasMember: z.array(ReferenceSchema).optional(),
  derivedFrom: z.array(ReferenceSchema).optional(),
  component: z.array(ObservationComponentSchema).optional(),
});

export const ObservationCreateSchema = ObservationBaseSchema;

export const ObservationSchema = ObservationBaseSchema.extend({
  id: z.string().min(1),
  meta: MetaSchema.optional(),
});

export const ObservationUpdateParamsSchema = z.object({
  id: z.string().min(1),
});

export const ObservationBundleSchema = z.object({
  resourceType: z.literal("Bundle"),
  type: z.string().optional(),
  total: z.number().optional(),
  link: z.array(BundleLinkSchema).optional(),
  entry: z.array(BundleEntrySchema(ObservationSchema)).optional(),
});

export type ObservationIdentifier = z.infer<typeof ObservationIdentifierSchema>;
export type ObservationStatus = z.infer<typeof ObservationStatusSchema>;
export type ObservationCoding = z.infer<typeof ObservationCodingSchema>;
export type ObservationQuantity = z.infer<typeof ObservationQuantitySchema>;
export type ObservationRange = z.infer<typeof ObservationRangeSchema>;
export type ObservationReferenceRange = z.infer<typeof ObservationReferenceRangeSchema>;
export type ObservationComponent = z.infer<typeof ObservationComponentSchema>;
export type ObservationNote = z.infer<typeof ObservationNoteSchema>;
export type ObservationPatchOperation = z.infer<typeof ObservationPatchOperationSchema>;
export type ObservationPatchInput = z.infer<typeof ObservationPatchSchema>;
export type Observation = z.infer<typeof ObservationSchema>;
export type ObservationCreateInput = z.infer<typeof ObservationCreateSchema>;
export type ObservationSearchParams = z.infer<typeof ObservationSearchParamsSchema>;
export type ObservationSearchResponse = z.infer<typeof ObservationBundleSchema>;

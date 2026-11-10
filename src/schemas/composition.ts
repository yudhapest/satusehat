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

export const CompositionIdentifierSchema = IdentifierSchema.extend({
  system: z.string().min(1).optional(),
  value: z.string().min(1),
});

export const CompositionIdentifierFieldSchema = z.union([
  CompositionIdentifierSchema,
  z.array(CompositionIdentifierSchema),
]);

export const CompositionStatusSchema = z.enum([
  "preliminary",
  "final",
  "amended",
  "entered-in-error",
]);

export const CompositionCodingSchema = z.object({
  system: z.string().min(1),
  code: z.string().min(1),
  display: z.string().optional(),
});

export const CompositionRequiredCodeableConceptSchema = CodeableConceptSchema.extend({
  coding: z.array(CompositionCodingSchema).min(1),
});

export const CompositionAttesterModeSchema = z.enum([
  "personal",
  "professional",
  "legal",
  "official",
]);

export const CompositionAttesterSchema = z.object({
  mode: CompositionAttesterModeSchema,
  time: z.string().optional(),
  party: ReferenceSchema.optional(),
});

export const CompositionRelatesToCodeSchema = z.enum([
  "replaces",
  "transforms",
  "signs",
  "appends",
]);

export const CompositionRelatesToSchema = z
  .object({
    code: CompositionRelatesToCodeSchema,
    targetIdentifier: IdentifierSchema.optional(),
    targetReference: ReferenceSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.targetIdentifier || value.targetReference) {
      return;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Composition relatesTo requires either "targetIdentifier" or "targetReference"',
      path: ["targetIdentifier"],
    });
  });

export const CompositionEventSchema = z.object({
  code: z.array(CodeableConceptSchema).optional(),
  period: PeriodSchema.optional(),
  detail: z.array(ReferenceSchema).optional(),
});

export const CompositionNarrativeStatusSchema = z.enum([
  "generated",
  "extensions",
  "additional",
  "empty",
]);

export const CompositionNarrativeSchema = z.object({
  status: CompositionNarrativeStatusSchema,
  div: z.string().min(1),
});

export const CompositionSectionModeSchema = z.enum([
  "working",
  "snapshot",
  "changes",
]);

type CompositionSectionShape = {
  title?: string | undefined;
  code?: z.infer<typeof CodeableConceptSchema> | undefined;
  author?: z.infer<typeof ReferenceSchema>[] | undefined;
  focus?: z.infer<typeof ReferenceSchema> | undefined;
  text?: z.infer<typeof CompositionNarrativeSchema> | undefined;
  mode?: z.infer<typeof CompositionSectionModeSchema> | undefined;
  orderedBy?: z.infer<typeof CodeableConceptSchema> | undefined;
  entry?: z.infer<typeof ReferenceSchema>[] | undefined;
  emptyReason?: z.infer<typeof CodeableConceptSchema> | undefined;
  section?: CompositionSectionShape[] | undefined;
};

export const CompositionSectionSchema: z.ZodType<CompositionSectionShape> = z.lazy(() =>
  z.object({
    title: z.string().min(1).optional(),
    code: CodeableConceptSchema.optional(),
    author: z.array(ReferenceSchema).optional(),
    focus: ReferenceSchema.optional(),
    text: CompositionNarrativeSchema.optional(),
    mode: CompositionSectionModeSchema.optional(),
    orderedBy: CodeableConceptSchema.optional(),
    entry: z.array(ReferenceSchema).optional(),
    emptyReason: CodeableConceptSchema.optional(),
    section: z.array(CompositionSectionSchema).optional(),
  }),
);

export const CompositionPatchOperationSchema = z.object({
  op: z.literal("replace"),
  path: z.string().min(1),
  value: z.unknown(),
});

export const CompositionPatchSchema = z.array(CompositionPatchOperationSchema).min(1);

export const CompositionSearchParamsSchema = z
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
      message: 'Composition search requires at least one of "subject" or "encounter"',
      path: ["subject"],
    });
  });

export const CompositionBaseSchema = z.object({
  resourceType: z.literal("Composition"),
  identifier: CompositionIdentifierFieldSchema.optional(),
  status: CompositionStatusSchema,
  type: CompositionRequiredCodeableConceptSchema,
  category: z.array(CodeableConceptSchema).optional(),
  subject: ReferenceSchema.optional(),
  encounter: ReferenceSchema.optional(),
  date: z.string().min(1),
  author: z.array(ReferenceSchema).min(1),
  title: z.string().min(1),
  confidentiality: z.string().min(1).optional(),
  attester: z.array(CompositionAttesterSchema).optional(),
  custodian: ReferenceSchema.optional(),
  relatesTo: z.array(CompositionRelatesToSchema).optional(),
  event: z.array(CompositionEventSchema).optional(),
  section: z.array(CompositionSectionSchema).optional(),
});

export const CompositionCreateSchema = CompositionBaseSchema;

export const CompositionSchema = CompositionBaseSchema.extend({
  id: z.string().min(1),
  meta: MetaSchema.optional(),
});

export const CompositionUpdateParamsSchema = z.object({
  id: z.string().min(1),
});

export const CompositionBundleSchema = z.object({
  resourceType: z.literal("Bundle"),
  type: z.string().optional(),
  total: z.number().optional(),
  link: z.array(BundleLinkSchema).optional(),
  entry: z.array(BundleEntrySchema(CompositionSchema)).optional(),
});

export type CompositionIdentifier = z.infer<typeof CompositionIdentifierSchema>;
export type CompositionStatus = z.infer<typeof CompositionStatusSchema>;
export type CompositionCoding = z.infer<typeof CompositionCodingSchema>;
export type CompositionAttesterMode = z.infer<typeof CompositionAttesterModeSchema>;
export type CompositionAttester = z.infer<typeof CompositionAttesterSchema>;
export type CompositionRelatesToCode = z.infer<typeof CompositionRelatesToCodeSchema>;
export type CompositionRelatesTo = z.infer<typeof CompositionRelatesToSchema>;
export type CompositionEvent = z.infer<typeof CompositionEventSchema>;
export type CompositionNarrativeStatus = z.infer<typeof CompositionNarrativeStatusSchema>;
export type CompositionNarrative = z.infer<typeof CompositionNarrativeSchema>;
export type CompositionSectionMode = z.infer<typeof CompositionSectionModeSchema>;
export type CompositionSection = z.infer<typeof CompositionSectionSchema>;
export type CompositionPatchOperation = z.infer<typeof CompositionPatchOperationSchema>;
export type CompositionPatchInput = z.infer<typeof CompositionPatchSchema>;
export type Composition = z.infer<typeof CompositionSchema>;
export type CompositionCreateInput = z.infer<typeof CompositionCreateSchema>;
export type CompositionSearchParams = z.infer<typeof CompositionSearchParamsSchema>;
export type CompositionSearchResponse = z.infer<typeof CompositionBundleSchema>;

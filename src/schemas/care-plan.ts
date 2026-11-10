import { z } from "zod";

import {
  CodeableConceptSchema,
  createSearchBundleSchema,
  IdentifierSchema,
  MetaSchema,
  PeriodSchema,
  ReferenceSchema,
} from "./common";

export const CarePlanIdentifierSchema = IdentifierSchema.extend({
  value: z.string().min(1).optional(),
});

export const CarePlanStatusSchema = z.enum([
  "draft",
  "active",
  "on-hold",
  "revoked",
  "completed",
  "entered-in-error",
  "unknown",
]);

export const CarePlanIntentSchema = z.enum([
  "proposal",
  "plan",
  "order",
  "option",
]);

export const CarePlanActivityStatusSchema = z.enum([
  "not-started",
  "scheduled",
  "in-progress",
  "on-hold",
  "completed",
  "cancelled",
  "stopped",
  "unknown",
  "entered-in-error",
]);

export const CarePlanQuantitySchema = z.object({
  value: z.union([z.number(), z.string()]),
  unit: z.string().optional(),
  system: z.string().optional(),
  code: z.string().optional(),
});

export const CarePlanAnnotationSchema = z.object({
  authorReference: ReferenceSchema.optional(),
  authorString: z.string().min(1).optional(),
  time: z.string().optional(),
  text: z.string().min(1),
});

export const CarePlanActivityDetailSchema = z.object({
  kind: z.string().min(1).optional(),
  instantiatesCanonical: z.array(z.string().min(1)).optional(),
  instantiatesUri: z.array(z.string().min(1)).optional(),
  code: CodeableConceptSchema.optional(),
  reasonCode: z.array(CodeableConceptSchema).optional(),
  reasonReference: z.array(ReferenceSchema).optional(),
  goal: z.array(ReferenceSchema).optional(),
  status: CarePlanActivityStatusSchema,
  statusReason: CodeableConceptSchema.optional(),
  doNotPerform: z.boolean().optional(),
  scheduledTiming: z.unknown().optional(),
  scheduledPeriod: PeriodSchema.optional(),
  scheduledString: z.string().min(1).optional(),
  location: ReferenceSchema.optional(),
  performer: z.array(ReferenceSchema).optional(),
  productCodeableConcept: CodeableConceptSchema.optional(),
  productReference: ReferenceSchema.optional(),
  dailyAmount: CarePlanQuantitySchema.optional(),
  quantity: CarePlanQuantitySchema.optional(),
  description: z.string().optional(),
});

export const CarePlanActivitySchema = z
  .object({
    outcomeCodeableConcept: z.array(CodeableConceptSchema).optional(),
    outcomeReference: z.array(ReferenceSchema).optional(),
    progress: z.array(CarePlanAnnotationSchema).optional(),
    reference: ReferenceSchema.optional(),
    detail: CarePlanActivityDetailSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.reference || value.detail) {
      return;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'CarePlan.activity requires either "reference" or "detail"',
      path: ["detail"],
    });
  });

export const CarePlanPatchOperationSchema = z.object({
  op: z.literal("replace"),
  path: z.string().min(1),
  value: z.unknown(),
});

export const CarePlanPatchSchema = z.array(CarePlanPatchOperationSchema).min(1);

const CarePlanSearchParamsObjectSchema = z.object({
  patient: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  encounter: z.guid().optional(),
});

export const CarePlanSearchParamsSchema = CarePlanSearchParamsObjectSchema.superRefine(
  (value, ctx) => {
    if (value.patient && value.subject) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Use only one CarePlan patient alias: "patient" or "subject"',
        path: ["subject"],
      });
      return;
    }

    if (value.patient || value.subject || value.encounter) {
      return;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Use at least one CarePlan search parameter: patient, subject, or encounter",
      path: ["patient"],
    });
  },
);

export const CarePlanNormalizedSearchParamsSchema = z
  .object({
    patient: z.string().min(1).optional(),
    encounter: z.guid().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.patient || value.encounter) {
      return;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Use at least one CarePlan search parameter: patient or encounter",
      path: ["patient"],
    });
  });

const CarePlanBaseObjectSchema = z.object({
  resourceType: z.literal("CarePlan"),
  identifier: z.array(CarePlanIdentifierSchema).optional(),
  instantiatesCanonical: z.array(z.string().min(1)).optional(),
  instantiatesUri: z.array(z.string().min(1)).optional(),
  basedOn: z.array(ReferenceSchema).optional(),
  replaces: z.array(ReferenceSchema).optional(),
  partOf: z.array(ReferenceSchema).optional(),
  status: CarePlanStatusSchema,
  intent: CarePlanIntentSchema,
  category: z.array(CodeableConceptSchema).min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  subject: ReferenceSchema,
  encounter: ReferenceSchema.optional(),
  period: PeriodSchema.optional(),
  created: z.string().optional(),
  author: ReferenceSchema.optional(),
  contributor: z.array(ReferenceSchema).optional(),
  careTeam: z.array(ReferenceSchema).optional(),
  addresses: z.array(ReferenceSchema).optional(),
  supportingInfo: z.array(ReferenceSchema).optional(),
  goal: z.array(ReferenceSchema).optional(),
  activity: z.array(CarePlanActivitySchema).optional(),
  note: z.array(CarePlanAnnotationSchema).optional(),
});

export const CarePlanCreateSchema = CarePlanBaseObjectSchema;

export const CarePlanSchema = CarePlanBaseObjectSchema.extend({
  id: z.string().min(1),
  meta: MetaSchema.optional(),
});

export const CarePlanUpdateParamsSchema = z.object({
  id: z.string().min(1),
});

export const CarePlanBundleSchema = createSearchBundleSchema(CarePlanSchema);

export type CarePlanIdentifier = z.infer<typeof CarePlanIdentifierSchema>;
export type CarePlanStatus = z.infer<typeof CarePlanStatusSchema>;
export type CarePlanIntent = z.infer<typeof CarePlanIntentSchema>;
export type CarePlanActivityStatus = z.infer<typeof CarePlanActivityStatusSchema>;
export type CarePlanQuantity = z.infer<typeof CarePlanQuantitySchema>;
export type CarePlanAnnotation = z.infer<typeof CarePlanAnnotationSchema>;
export type CarePlanActivityDetail = z.infer<typeof CarePlanActivityDetailSchema>;
export type CarePlanActivity = z.infer<typeof CarePlanActivitySchema>;
export type CarePlanPatchOperation = z.infer<typeof CarePlanPatchOperationSchema>;
export type CarePlanPatchInput = z.infer<typeof CarePlanPatchSchema>;
export type CarePlan = z.infer<typeof CarePlanSchema>;
export type CarePlanCreateInput = z.infer<typeof CarePlanCreateSchema>;
export type CarePlanSearchParams = z.infer<typeof CarePlanSearchParamsSchema>;
export type CarePlanSearchResponse = z.infer<typeof CarePlanBundleSchema>;

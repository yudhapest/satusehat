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

export const NutritionOrderIdentifierSchema = IdentifierSchema.extend({
  value: z.string().min(1).optional(),
});

export const NutritionOrderStatusSchema = z.enum([
  "draft",
  "active",
  "on-hold",
  "revoked",
  "completed",
  "entered-in-error",
  "unknown",
]);

export const NutritionOrderIntentSchema = z.enum([
  "proposal",
  "plan",
  "directive",
  "order",
  "original-order",
  "reflex-order",
  "filler-order",
  "instance-order",
  "option",
]);

export const NutritionOrderPrioritySchema = z.enum(["routine", "urgent", "asap", "stat"]);

export const NutritionOrderQuantitySchema = z.object({
  value: z.union([z.number(), z.string()]),
  unit: z.string().optional(),
  system: z.string().optional(),
  code: z.string().optional(),
});

export const NutritionOrderRatioSchema = z.object({
  numerator: NutritionOrderQuantitySchema.optional(),
  denominator: NutritionOrderQuantitySchema.optional(),
});

export const NutritionOrderTimingRepeatSchema = z.object({
  boundsPeriod: PeriodSchema.optional(),
  count: z.number().int().positive().optional(),
  countMax: z.number().int().positive().optional(),
  duration: z.number().positive().optional(),
  durationMax: z.number().positive().optional(),
  durationUnit: z.string().optional(),
  frequency: z.number().int().positive().optional(),
  frequencyMax: z.number().int().positive().optional(),
  period: z.number().positive().optional(),
  periodMax: z.number().positive().optional(),
  periodUnit: z.string().optional(),
  dayOfWeek: z.array(z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"])).optional(),
  timeOfDay: z.array(z.string()).optional(),
});

export const NutritionOrderTimingSchema = z.object({
  code: CodeableConceptSchema.optional(),
  repeat: NutritionOrderTimingRepeatSchema.optional(),
});

export const NutritionOrderOralDietNutrientSchema = z.object({
  modifier: CodeableConceptSchema.optional(),
  amount: NutritionOrderQuantitySchema.optional(),
});

export const NutritionOrderOralDietTextureSchema = z.object({
  modifier: CodeableConceptSchema.optional(),
  foodType: CodeableConceptSchema.optional(),
});

export const NutritionOrderOralDietSchema = z.object({
  type: z.array(CodeableConceptSchema).optional(),
  schedule: z.array(NutritionOrderTimingSchema).optional(),
  nutrient: z.array(NutritionOrderOralDietNutrientSchema).optional(),
  texture: z.array(NutritionOrderOralDietTextureSchema).optional(),
  fluidConsistencyType: z.array(CodeableConceptSchema).optional(),
  instruction: z.string().optional(),
});

export const NutritionOrderSupplementSchema = z.object({
  type: CodeableConceptSchema.optional(),
  productName: z.string().optional(),
  schedule: z.array(NutritionOrderTimingSchema).optional(),
  quantity: NutritionOrderQuantitySchema.optional(),
  instruction: z.string().optional(),
});

export const NutritionOrderEnteralFormulaAdministrationSchema = z.object({
  schedule: NutritionOrderTimingSchema.optional(),
  quantity: NutritionOrderQuantitySchema.optional(),
  rateQuantity: NutritionOrderQuantitySchema.optional(),
  rateRatio: NutritionOrderRatioSchema.optional(),
});

export const NutritionOrderEnteralFormulaSchema = z.object({
  baseFormulaType: CodeableConceptSchema.optional(),
  baseFormulaProductName: z.string().optional(),
  additiveType: CodeableConceptSchema.optional(),
  additiveProductName: z.string().optional(),
  caloricDensity: NutritionOrderQuantitySchema.optional(),
  routeofAdministration: CodeableConceptSchema.optional(),
  administration: z.array(NutritionOrderEnteralFormulaAdministrationSchema).optional(),
  maxVolumeToDeliver: NutritionOrderQuantitySchema.optional(),
  administrationInstruction: z.string().optional(),
});

export const NutritionOrderPatchOperationSchema = z.object({
  op: z.literal("replace"),
  path: z.string().min(1),
  value: z.unknown(),
});

export const NutritionOrderPatchSchema = z.array(NutritionOrderPatchOperationSchema).min(1);

export const NutritionOrderNoteSchema = z.object({
  authorReference: ReferenceSchema.optional(),
  authorString: z.string().min(1).optional(),
  time: z.string().optional(),
  text: z.string().min(1),
});

const NutritionOrderSearchParamsObjectSchema = z.object({
  patient: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  encounter: z.guid().optional(),
});

export const NutritionOrderSearchParamsSchema = NutritionOrderSearchParamsObjectSchema
  .superRefine((value, ctx) => {
    if (value.patient && value.subject) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Use only one NutritionOrder patient alias: "patient" or "subject"',
        path: ["subject"],
      });
      return;
    }

    if (value.patient || value.subject || value.encounter) {
      return;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Use at least one NutritionOrder search parameter: patient, subject, or encounter",
      path: ["patient"],
    });
  });

export const NutritionOrderNormalizedSearchParamsSchema = z
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
      message: "Use at least one NutritionOrder search parameter: patient or encounter",
      path: ["patient"],
    });
  });

const NutritionOrderBaseObjectSchema = z.object({
  resourceType: z.literal("NutritionOrder"),
  identifier: z.array(NutritionOrderIdentifierSchema).optional(),
  instantiatesCanonical: z.array(z.string().min(1)).optional(),
  instantiatesUri: z.array(z.string().min(1)).optional(),
  instantiates: z.array(z.string().min(1)).optional(),
  status: NutritionOrderStatusSchema,
  intent: NutritionOrderIntentSchema,
  priority: NutritionOrderPrioritySchema.optional(),
  patient: ReferenceSchema.optional(),
  subject: ReferenceSchema.optional(),
  encounter: ReferenceSchema.optional(),
  dateTime: z.string(),
  orderer: ReferenceSchema.optional(),
  allergyIntolerance: z.array(ReferenceSchema).optional(),
  foodPreferenceModifier: z.array(CodeableConceptSchema).optional(),
  excludeFoodModifier: z.array(CodeableConceptSchema).optional(),
  oralDiet: NutritionOrderOralDietSchema.optional(),
  supplement: z.array(NutritionOrderSupplementSchema).optional(),
  enteralFormula: NutritionOrderEnteralFormulaSchema.optional(),
  note: z.array(NutritionOrderNoteSchema).optional(),
});

function validateNutritionOrderPatientAlias(
  value: z.infer<typeof NutritionOrderBaseObjectSchema>,
  ctx: z.RefinementCtx,
) {
  const hasPatient = Boolean(value.patient);
  const hasSubject = Boolean(value.subject);

  if (!hasPatient && !hasSubject) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'NutritionOrder requires either "patient" or "subject"',
      path: ["patient"],
    });
  }

  if (hasPatient && hasSubject) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'NutritionOrder accepts only one of "patient" or "subject"',
      path: ["subject"],
    });
  }
}

export const NutritionOrderCreateSchema = NutritionOrderBaseObjectSchema.superRefine(
  validateNutritionOrderPatientAlias,
);

export const NutritionOrderSchema = NutritionOrderBaseObjectSchema.extend({
  id: z.string().min(1),
  meta: MetaSchema.optional(),
}).superRefine(validateNutritionOrderPatientAlias);

export const NutritionOrderUpdateParamsSchema = z.object({
  id: z.string().min(1),
});

export const NutritionOrderBundleSchema = z.object({
  resourceType: z.literal("Bundle"),
  type: z.string().optional(),
  total: z.number().optional(),
  link: z.array(BundleLinkSchema).optional(),
  entry: z.array(BundleEntrySchema(NutritionOrderSchema)).optional(),
});

export type NutritionOrderIdentifier = z.infer<typeof NutritionOrderIdentifierSchema>;
export type NutritionOrderStatus = z.infer<typeof NutritionOrderStatusSchema>;
export type NutritionOrderIntent = z.infer<typeof NutritionOrderIntentSchema>;
export type NutritionOrderPriority = z.infer<typeof NutritionOrderPrioritySchema>;
export type NutritionOrderQuantity = z.infer<typeof NutritionOrderQuantitySchema>;
export type NutritionOrderRatio = z.infer<typeof NutritionOrderRatioSchema>;
export type NutritionOrderTimingRepeat = z.infer<typeof NutritionOrderTimingRepeatSchema>;
export type NutritionOrderTiming = z.infer<typeof NutritionOrderTimingSchema>;
export type NutritionOrderOralDietNutrient = z.infer<
  typeof NutritionOrderOralDietNutrientSchema
>;
export type NutritionOrderOralDietTexture = z.infer<
  typeof NutritionOrderOralDietTextureSchema
>;
export type NutritionOrderOralDiet = z.infer<typeof NutritionOrderOralDietSchema>;
export type NutritionOrderSupplement = z.infer<typeof NutritionOrderSupplementSchema>;
export type NutritionOrderEnteralFormulaAdministration = z.infer<
  typeof NutritionOrderEnteralFormulaAdministrationSchema
>;
export type NutritionOrderEnteralFormula = z.infer<typeof NutritionOrderEnteralFormulaSchema>;
export type NutritionOrderNote = z.infer<typeof NutritionOrderNoteSchema>;
export type NutritionOrderPatchOperation = z.infer<typeof NutritionOrderPatchOperationSchema>;
export type NutritionOrderPatchInput = z.infer<typeof NutritionOrderPatchSchema>;
export type NutritionOrder = z.infer<typeof NutritionOrderSchema>;
export type NutritionOrderCreateInput = z.infer<typeof NutritionOrderCreateSchema>;
export type NutritionOrderSearchParams = z.infer<typeof NutritionOrderSearchParamsSchema>;
export type NutritionOrderSearchResponse = z.infer<typeof NutritionOrderBundleSchema>;

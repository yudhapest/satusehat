import { z } from "zod";

import {
  CodingSchema,
  createSearchBundleSchema,
  MetaSchema,
  ReferenceSchema,
} from "./common";

const QuestionnaireResponseAnswerValueFieldsSchema = z.object({
  valueBoolean: z.boolean().optional(),
  valueDecimal: z.number().optional(),
  valueInteger: z.number().int().optional(),
  valueDate: z.string().optional(),
  valueDateTime: z.string().optional(),
  valueTime: z.string().optional(),
  valueString: z.string().optional(),
  valueUri: z.string().optional(),
  valueAttachment: z
    .object({
      contentType: z.string().optional(),
      url: z.string().optional(),
      title: z.string().optional(),
    })
    .optional(),
  valueCoding: CodingSchema.optional(),
  valueQuantity: z
    .object({
      value: z.number().optional(),
      unit: z.string().optional(),
      system: z.string().optional(),
      code: z.string().optional(),
    })
    .optional(),
  valueReference: ReferenceSchema.optional(),
});

function hasAtLeastOneAnswerValue(
  value: z.infer<typeof QuestionnaireResponseAnswerValueFieldsSchema>,
): boolean {
  return Object.values(value).some((entry) => entry !== undefined);
}

export const QuestionnaireResponseAnswerValueSchema =
  QuestionnaireResponseAnswerValueFieldsSchema.refine(
    hasAtLeastOneAnswerValue,
    "QuestionnaireResponse answer must contain at least one value[x] field",
  );

export const QuestionnaireResponseAnswerSchema: z.ZodType = z.lazy(() =>
  QuestionnaireResponseAnswerValueFieldsSchema.extend({
    item: z.array(QuestionnaireResponseItemSchema).optional(),
  }).refine(
    hasAtLeastOneAnswerValue,
    "QuestionnaireResponse answer must contain at least one value[x] field",
  ),
);

export const QuestionnaireResponseItemSchema: z.ZodType = z.lazy(() =>
  z.object({
    linkId: z.string().min(1),
    definition: z.string().optional(),
    text: z.string().optional(),
    answer: z.array(QuestionnaireResponseAnswerSchema).optional(),
    item: z.array(QuestionnaireResponseItemSchema).optional(),
  }),
);

export const QuestionnaireResponsePatchOperationSchema = z.object({
  op: z.literal("replace"),
  path: z.string().min(1),
  value: z.unknown(),
});

export const QuestionnaireResponsePatchSchema = z
  .array(QuestionnaireResponsePatchOperationSchema)
  .min(1);

export const QuestionnaireResponseSearchParamsSchema = z
  .object({
    patient: z.string().min(1).optional(),
    encounter: z.guid().optional(),
  })
  .superRefine((value, ctx) => {
    const hasPatient = Boolean(value.patient);
    const hasEncounter = Boolean(value.encounter);

    if (hasPatient && hasEncounter) {
      return;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Use QuestionnaireResponse search mode: patient + encounter",
      path: ["patient"],
    });
  });

export const QuestionnaireResponseBaseSchema = z.object({
  resourceType: z.literal("QuestionnaireResponse"),
  questionnaire: z.string().optional(),
  status: z.enum(["in-progress", "completed", "amended", "entered-in-error", "stopped"]),
  subject: ReferenceSchema.optional(),
  encounter: ReferenceSchema.optional(),
  authored: z.string().optional(),
  author: ReferenceSchema.optional(),
  source: ReferenceSchema.optional(),
  item: z.array(QuestionnaireResponseItemSchema).optional(),
});

export const QuestionnaireResponseCreateSchema = QuestionnaireResponseBaseSchema;

export const QuestionnaireResponseSchema = QuestionnaireResponseBaseSchema.extend({
  id: z.string().min(1),
  meta: MetaSchema.optional(),
});

export const QuestionnaireResponseUpdateParamsSchema = z.object({
  id: z.string().min(1),
});

export const QuestionnaireResponseBundleSchema = createSearchBundleSchema(QuestionnaireResponseSchema);

export type QuestionnaireResponseAnswerValue = z.infer<typeof QuestionnaireResponseAnswerValueSchema>;
export type QuestionnaireResponseAnswer = z.infer<typeof QuestionnaireResponseAnswerSchema>;
export type QuestionnaireResponseItem = z.infer<typeof QuestionnaireResponseItemSchema>;
export type QuestionnaireResponsePatchOperation = z.infer<typeof QuestionnaireResponsePatchOperationSchema>;
export type QuestionnaireResponsePatchInput = z.infer<typeof QuestionnaireResponsePatchSchema>;
export type QuestionnaireResponse = z.infer<typeof QuestionnaireResponseSchema>;
export type QuestionnaireResponseCreateInput = z.infer<typeof QuestionnaireResponseCreateSchema>;
export type QuestionnaireResponseSearchParams = z.infer<typeof QuestionnaireResponseSearchParamsSchema>;
export type QuestionnaireResponseSearchResponse = z.infer<typeof QuestionnaireResponseBundleSchema>;

import { z } from "zod";

import {
  CodeableConceptSchema,
  createSearchBundleSchema,
  IdentifierSchema,
  MetaSchema,
  PeriodSchema,
  ReferenceSchema,
} from "./common";

export const EpisodeOfCareIdentifierSchema = IdentifierSchema.extend({
  system: z
    .string()
    .regex(
      /^http:\/\/sys-ids\.kemkes\.go\.id\/episode-of-care\/[^/]+\/?$/,
      "EpisodeOfCare identifier.system must use http://sys-ids.kemkes.go.id/episode-of-care/{organization-ihs-number}",
    )
    .optional(),
  value: z.string().min(1),
});

export const EpisodeOfCareStatusSchema = z.enum([
  "planned",
  "waitlist",
  "active",
  "onhold",
  "finished",
  "cancelled",
  "entered-in-error",
]);

export const EpisodeOfCareStatusHistorySchema = z.object({
  status: EpisodeOfCareStatusSchema,
  period: PeriodSchema.extend({
    start: z.string().min(1),
  }),
});

export const EpisodeOfCareDiagnosisSchema = z.object({
  condition: ReferenceSchema,
  role: CodeableConceptSchema.optional(),
  rank: z.number().int().positive().optional(),
});

export const EpisodeOfCarePatchOperationSchema = z.object({
  op: z.literal("replace"),
  path: z.string().min(1),
  value: z.unknown(),
});

export const EpisodeOfCarePatchSchema = z
  .array(EpisodeOfCarePatchOperationSchema)
  .min(1);

export const EpisodeOfCareSearchParamsSchema = z
  .object({
    subject: z.string().min(1).optional(),
    organization: z.string().min(1).optional(),
    "care-manager": z.string().min(1).optional(),
    identifier: z.string().min(1).optional(),
    status: EpisodeOfCareStatusSchema.optional(),
    type: z.string().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.subject ||
      value.organization ||
      value["care-manager"] ||
      value.identifier ||
      value.status ||
      value.type
    ) {
      return;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Use at least one EpisodeOfCare search parameter: subject, organization, care-manager, identifier, status, or type",
      path: ["subject"],
    });
  });

const EpisodeOfCareBaseObjectSchema = z.object({
  resourceType: z.literal("EpisodeOfCare"),
  identifier: z.array(EpisodeOfCareIdentifierSchema).optional(),
  status: EpisodeOfCareStatusSchema,
  statusHistory: z.array(EpisodeOfCareStatusHistorySchema).optional(),
  type: z.array(CodeableConceptSchema).optional(),
  diagnosis: z.array(EpisodeOfCareDiagnosisSchema).optional(),
  patient: ReferenceSchema,
  managingOrganization: ReferenceSchema.optional(),
  period: PeriodSchema.optional(),
  referralRequest: z.array(ReferenceSchema).optional(),
  careManager: ReferenceSchema.optional(),
  team: z.array(ReferenceSchema).optional(),
  account: z.array(ReferenceSchema).optional(),
});

export const EpisodeOfCareCreateSchema = EpisodeOfCareBaseObjectSchema;

export const EpisodeOfCareSchema = EpisodeOfCareBaseObjectSchema.extend({
  id: z.string().min(1),
  meta: MetaSchema.optional(),
});

export const EpisodeOfCareUpdateParamsSchema = z.object({
  id: z.string().min(1),
});

export const EpisodeOfCareBundleSchema = createSearchBundleSchema(EpisodeOfCareSchema);

export type EpisodeOfCareIdentifier = z.infer<
  typeof EpisodeOfCareIdentifierSchema
>;
export type EpisodeOfCareStatus = z.infer<typeof EpisodeOfCareStatusSchema>;
export type EpisodeOfCareStatusHistory = z.infer<
  typeof EpisodeOfCareStatusHistorySchema
>;
export type EpisodeOfCareDiagnosis = z.infer<
  typeof EpisodeOfCareDiagnosisSchema
>;
export type EpisodeOfCarePatchOperation = z.infer<
  typeof EpisodeOfCarePatchOperationSchema
>;
export type EpisodeOfCarePatchInput = z.infer<
  typeof EpisodeOfCarePatchSchema
>;
export type EpisodeOfCare = z.infer<typeof EpisodeOfCareSchema>;
export type EpisodeOfCareCreateInput = z.infer<
  typeof EpisodeOfCareCreateSchema
>;
export type EpisodeOfCareSearchParams = z.infer<
  typeof EpisodeOfCareSearchParamsSchema
>;
export type EpisodeOfCareSearchResponse = z.infer<
  typeof EpisodeOfCareBundleSchema
>;

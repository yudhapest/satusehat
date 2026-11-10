import { z } from "zod";

import {
  AttachmentSchema,
  CodeableConceptSchema,
  createSearchBundleSchema,
  IdentifierSchema,
  MetaSchema,
  PeriodSchema,
  ReferenceSchema,
} from "./common";

export const DiagnosticReportIdentifierSchema = IdentifierSchema.extend({
  system: z
    .string()
    .regex(
      /^http:\/\/sys-ids\.kemkes\.go\.id\/diagnostic\/.+\/.+$/,
      "DiagnosticReport identifier.system must use http://sys-ids.kemkes.go.id/diagnostic/{organization-ihs-number}/{category}",
    ),
  value: z.string().min(1),
});

export const DiagnosticReportStatusSchema = z.enum([
  "registered",
  "partial",
  "preliminary",
  "final",
  "amended",
  "corrected",
  "appended",
  "cancelled",
  "entered-in-error",
  "unknown",
]);

export const DiagnosticReportCodingSchema = z.object({
  system: z.string().min(1),
  code: z.string().min(1),
  display: z.string().optional(),
});

export const DiagnosticReportRequiredCodeableConceptSchema = CodeableConceptSchema.extend({
  coding: z.array(DiagnosticReportCodingSchema).min(1),
});

export const DiagnosticReportMediaSchema = z.object({
  comment: z.string().min(1).optional(),
  link: ReferenceSchema,
});

export const DiagnosticReportPatchOperationSchema = z.object({
  op: z.literal("replace"),
  path: z.string().min(1),
  value: z.unknown(),
});

export const DiagnosticReportPatchSchema = z.array(DiagnosticReportPatchOperationSchema).min(1);

export const DiagnosticReportSearchParamsSchema = z
  .object({
    subject: z.string().min(1).optional(),
    encounter: z.guid().optional(),
    specimen: z.guid().optional(),
  })
  .superRefine((value, ctx) => {
    const hasSubject = Boolean(value.subject);
    const hasEncounter = Boolean(value.encounter);
    const hasSpecimen = Boolean(value.specimen);

    if (hasSpecimen && !hasSubject) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'DiagnosticReport search with "specimen" also requires "subject"',
        path: ["subject"],
      });
      return;
    }

    if (hasSubject || hasEncounter) {
      return;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Use one DiagnosticReport search mode: subject and/or encounter, or subject with "specimen"',
      path: ["subject"],
    });
  });

export const DiagnosticReportBaseSchema = z.object({
  resourceType: z.literal("DiagnosticReport"),
  identifier: z.array(DiagnosticReportIdentifierSchema).optional(),
  basedOn: z.array(ReferenceSchema).optional(),
  status: DiagnosticReportStatusSchema,
  category: z.array(CodeableConceptSchema).optional(),
  code: DiagnosticReportRequiredCodeableConceptSchema,
  subject: ReferenceSchema,
  encounter: ReferenceSchema,
  effectiveDateTime: z.string().optional(),
  effectivePeriod: PeriodSchema.optional(),
  effectiveTiming: z.unknown().optional(),
  effectiveInstant: z.string().optional(),
  issued: z.string().optional(),
  performer: z.array(ReferenceSchema).optional(),
  resultsInterpreter: z.array(ReferenceSchema).optional(),
  specimen: z.array(ReferenceSchema).optional(),
  result: z.array(ReferenceSchema).optional(),
  imagingStudy: z.array(ReferenceSchema).optional(),
  media: z.array(DiagnosticReportMediaSchema).optional(),
  conclusion: z.string().optional(),
  conclusionCode: z.array(CodeableConceptSchema).optional(),
  presentedForm: z.array(AttachmentSchema).optional(),
});

export const DiagnosticReportCreateSchema = DiagnosticReportBaseSchema;

export const DiagnosticReportSchema = DiagnosticReportBaseSchema.extend({
  id: z.string().min(1),
  meta: MetaSchema.optional(),
});

export const DiagnosticReportUpdateParamsSchema = z.object({
  id: z.string().min(1),
});

export const DiagnosticReportBundleSchema = createSearchBundleSchema(DiagnosticReportSchema);

export type DiagnosticReportIdentifier = z.infer<typeof DiagnosticReportIdentifierSchema>;
export type DiagnosticReportStatus = z.infer<typeof DiagnosticReportStatusSchema>;
export type DiagnosticReportCoding = z.infer<typeof DiagnosticReportCodingSchema>;
export type DiagnosticReportMedia = z.infer<typeof DiagnosticReportMediaSchema>;
export type DiagnosticReportPatchOperation = z.infer<typeof DiagnosticReportPatchOperationSchema>;
export type DiagnosticReportPatchInput = z.infer<typeof DiagnosticReportPatchSchema>;
export type DiagnosticReport = z.infer<typeof DiagnosticReportSchema>;
export type DiagnosticReportCreateInput = z.infer<typeof DiagnosticReportCreateSchema>;
export type DiagnosticReportSearchParams = z.infer<typeof DiagnosticReportSearchParamsSchema>;
export type DiagnosticReportSearchResponse = z.infer<typeof DiagnosticReportBundleSchema>;

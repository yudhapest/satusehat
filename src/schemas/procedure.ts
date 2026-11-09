import { z } from "zod";

import {
  CodeableConceptSchema,
  createSearchBundleSchema,
  IdentifierSchema,
  MetaSchema,
  PeriodSchema,
  ReferenceSchema,
} from "./common";

export const ProcedureIdentifierSchema = IdentifierSchema.extend({
  system: z
    .string()
    .regex(
      /^http:\/\/sys-ids\.kemkes\.go\.id\/procedure\/.+$/,
      "Procedure identifier.system must use http://sys-ids.kemkes.go.id/procedure/{organization-ihs-number}",
    ),
  value: z.string().min(1),
});

export const ProcedureStatusSchema = z.enum([
  "preparation",
  "in-progress",
  "not-done",
  "on-hold",
  "stopped",
  "completed",
  "entered-in-error",
  "unknown",
]);

export const ProcedureCodingSchema = z.object({
  system: z.string().min(1),
  code: z.string().min(1),
  display: z.string().optional(),
});

export const ProcedureRequiredCodeableConceptSchema = CodeableConceptSchema.extend({
  coding: z.array(ProcedureCodingSchema).min(1),
});

export const ProcedurePerformerSchema = z.object({
  function: CodeableConceptSchema.optional(),
  actor: ReferenceSchema,
  onBehalfOf: ReferenceSchema.optional(),
});

export const ProcedureNoteSchema = z.object({
  authorReference: ReferenceSchema.optional(),
  authorString: z.string().min(1).optional(),
  time: z.string().optional(),
  text: z.string().min(1),
});

export const ProcedureFocalDeviceSchema = z.object({
  action: CodeableConceptSchema.optional(),
  manipulated: ReferenceSchema,
});

export const ProcedurePatchOperationSchema = z.object({
  op: z.literal("replace"),
  path: z.string().min(1),
  value: z.unknown(),
});

export const ProcedurePatchSchema = z.array(ProcedurePatchOperationSchema).min(1);

export const ProcedureSearchParamsSchema = z
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
      message: "Use at least one Procedure search parameter: subject or encounter",
      path: ["subject"],
    });
  });

export const ProcedureBaseSchema = z.object({
  resourceType: z.literal("Procedure"),
  identifier: z.array(ProcedureIdentifierSchema).optional(),
  basedOn: z.array(ReferenceSchema).optional(),
  partOf: z.array(ReferenceSchema).optional(),
  status: ProcedureStatusSchema,
  statusReason: CodeableConceptSchema.optional(),
  category: CodeableConceptSchema.optional(),
  code: ProcedureRequiredCodeableConceptSchema,
  subject: ReferenceSchema,
  encounter: ReferenceSchema,
  performedDateTime: z.string().optional(),
  performedPeriod: PeriodSchema.optional(),
  recorder: ReferenceSchema.optional(),
  asserter: ReferenceSchema.optional(),
  performer: z.array(ProcedurePerformerSchema).optional(),
  location: ReferenceSchema.optional(),
  reasonCode: z.array(CodeableConceptSchema).optional(),
  reasonReference: z.array(ReferenceSchema).optional(),
  bodySite: z.array(CodeableConceptSchema).optional(),
  outcome: CodeableConceptSchema.optional(),
  report: z.array(ReferenceSchema).optional(),
  complication: z.array(CodeableConceptSchema).optional(),
  complicationDetail: z.array(ReferenceSchema).optional(),
  followUp: z.array(CodeableConceptSchema).optional(),
  note: z.array(ProcedureNoteSchema).optional(),
  focalDevice: z.array(ProcedureFocalDeviceSchema).optional(),
  usedReference: z.array(ReferenceSchema).optional(),
  usedCode: z.array(CodeableConceptSchema).optional(),
});

export const ProcedureCreateSchema = ProcedureBaseSchema;

export const ProcedureSchema = ProcedureBaseSchema.extend({
  id: z.string().min(1),
  meta: MetaSchema.optional(),
});

export const ProcedureUpdateParamsSchema = z.object({
  id: z.string().min(1),
});

export const ProcedureBundleSchema = createSearchBundleSchema(ProcedureSchema);

export type ProcedureIdentifier = z.infer<typeof ProcedureIdentifierSchema>;
export type ProcedureStatus = z.infer<typeof ProcedureStatusSchema>;
export type ProcedureCoding = z.infer<typeof ProcedureCodingSchema>;
export type ProcedurePerformer = z.infer<typeof ProcedurePerformerSchema>;
export type ProcedureNote = z.infer<typeof ProcedureNoteSchema>;
export type ProcedureFocalDevice = z.infer<typeof ProcedureFocalDeviceSchema>;
export type ProcedurePatchOperation = z.infer<typeof ProcedurePatchOperationSchema>;
export type ProcedurePatchInput = z.infer<typeof ProcedurePatchSchema>;
export type Procedure = z.infer<typeof ProcedureSchema>;
export type ProcedureCreateInput = z.infer<typeof ProcedureCreateSchema>;
export type ProcedureSearchParams = z.infer<typeof ProcedureSearchParamsSchema>;
export type ProcedureSearchResponse = z.infer<typeof ProcedureBundleSchema>;

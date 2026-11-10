import { z } from "zod";

import {
  CodeableConceptSchema,
  createSearchBundleSchema,
  IdentifierSchema,
  MetaSchema,
  ReferenceSchema,
} from "./common";

const ImagingStudyIdentifierSystemRegex =
  /^https?:\/\/sys-ids\.kemkes\.go\.id\/(?:acsn|accessionno)\/.+$/;

const ImagingStudySearchIdentifierRegex =
  /^https?:\/\/sys-ids\.kemkes\.go\.id\/(?:acsn|accessionno)\/[^|]+\|.+$/;

export const ImagingStudyIdentifierSchema = IdentifierSchema.extend({
  use: z.string().min(1),
  system: z
    .string()
    .regex(
      ImagingStudyIdentifierSystemRegex,
      "ImagingStudy identifier.system must use http(s)://sys-ids.kemkes.go.id/acsn/{organization-ihs-number}",
    ),
  value: z.string().min(1),
});

export const ImagingStudyStatusSchema = z.enum([
  "registered",
  "available",
  "cancelled",
  "entered-in-error",
  "unknown",
]);

export const ImagingStudyCodingSchema = z.object({
  system: z.string().min(1),
  code: z.string().min(1),
  display: z.string().optional(),
});

export const ImagingStudyRequiredCodeableConceptSchema = CodeableConceptSchema.extend({
  coding: z.array(ImagingStudyCodingSchema).min(1),
});

export const ImagingStudyNoteSchema = z.object({
  authorReference: ReferenceSchema.optional(),
  authorString: z.string().min(1).optional(),
  time: z.string().optional(),
  text: z.string().min(1),
});

export const ImagingStudySeriesPerformerSchema = z.object({
  function: ImagingStudyRequiredCodeableConceptSchema.optional(),
  actor: ReferenceSchema,
});

export const ImagingStudySeriesInstanceSchema = z.object({
  uid: z.string().min(1),
  sopClass: ImagingStudyCodingSchema,
  number: z.number().int().nonnegative().optional(),
  title: z.string().min(1).optional(),
});

export const ImagingStudySeriesSchema = z.object({
  uid: z.string().min(1),
  number: z.number().int().nonnegative().optional(),
  modality: ImagingStudyCodingSchema,
  description: z.string().min(1).optional(),
  numberOfInstances: z.number().int().nonnegative().optional(),
  endpoint: z.array(ReferenceSchema).optional(),
  bodySite: ImagingStudyCodingSchema.optional(),
  laterality: ImagingStudyCodingSchema.optional(),
  specimen: z.array(ReferenceSchema).optional(),
  started: z.string().optional(),
  performer: z.array(ImagingStudySeriesPerformerSchema).optional(),
  instance: z.array(ImagingStudySeriesInstanceSchema).optional(),
});

export const ImagingStudySearchParamsSchema = z.object({
  identifier: z
    .string()
    .regex(
      ImagingStudySearchIdentifierRegex,
      'ImagingStudy search "identifier" must use http(s)://sys-ids.kemkes.go.id/acsn/{subject}|{accession-number}',
    ),
});

export const ImagingStudyPatchOperationSchema = z.object({
  op: z.literal("replace"),
  path: z.string().min(1),
  value: z.unknown(),
});

export const ImagingStudyPatchSchema = z.array(ImagingStudyPatchOperationSchema).min(1);

export const ImagingStudyBaseSchema = z.object({
  resourceType: z.literal("ImagingStudy"),
  identifier: z.array(ImagingStudyIdentifierSchema).min(1),
  status: ImagingStudyStatusSchema,
  modality: z.array(ImagingStudyCodingSchema).min(1),
  subject: ReferenceSchema,
  encounter: ReferenceSchema.optional(),
  started: z.string().optional(),
  basedOn: z.array(ReferenceSchema).min(1),
  referrer: ReferenceSchema.optional(),
  interpreter: z.array(ReferenceSchema).optional(),
  endpoint: z.array(ReferenceSchema).optional(),
  numberOfSeries: z.number().int().nonnegative().optional(),
  numberOfInstances: z.number().int().nonnegative().optional(),
  procedureReference: z.array(ReferenceSchema).optional(),
  procedureCode: z.array(ImagingStudyRequiredCodeableConceptSchema).optional(),
  location: ReferenceSchema.optional(),
  reasonCode: z.array(ImagingStudyRequiredCodeableConceptSchema).optional(),
  reasonReference: z.array(ReferenceSchema).optional(),
  note: z.array(ImagingStudyNoteSchema).optional(),
  description: z.string().min(1).optional(),
  series: z.array(ImagingStudySeriesSchema).optional(),
});

export const ImagingStudyCreateSchema = ImagingStudyBaseSchema;

export const ImagingStudySchema = ImagingStudyBaseSchema.extend({
  id: z.string().min(1),
  meta: MetaSchema.optional(),
});

export const ImagingStudyUpdateParamsSchema = z.object({
  id: z.string().min(1),
});

export const ImagingStudyBundleSchema = createSearchBundleSchema(ImagingStudySchema);

export type ImagingStudyIdentifier = z.infer<typeof ImagingStudyIdentifierSchema>;
export type ImagingStudyStatus = z.infer<typeof ImagingStudyStatusSchema>;
export type ImagingStudyCoding = z.infer<typeof ImagingStudyCodingSchema>;
export type ImagingStudyNote = z.infer<typeof ImagingStudyNoteSchema>;
export type ImagingStudySeriesPerformer = z.infer<typeof ImagingStudySeriesPerformerSchema>;
export type ImagingStudySeriesInstance = z.infer<typeof ImagingStudySeriesInstanceSchema>;
export type ImagingStudySeries = z.infer<typeof ImagingStudySeriesSchema>;
export type ImagingStudyPatchOperation = z.infer<typeof ImagingStudyPatchOperationSchema>;
export type ImagingStudyPatchInput = z.infer<typeof ImagingStudyPatchSchema>;
export type ImagingStudy = z.infer<typeof ImagingStudySchema>;
export type ImagingStudyCreateInput = z.infer<typeof ImagingStudyCreateSchema>;
export type ImagingStudySearchParams = z.infer<typeof ImagingStudySearchParamsSchema>;
export type ImagingStudySearchResponse = z.infer<typeof ImagingStudyBundleSchema>;

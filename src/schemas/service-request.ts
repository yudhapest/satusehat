import { z } from "zod";

import {
  CodeableConceptSchema,
  createSearchBundleSchema,
  IdentifierSchema,
  MetaSchema,
  PeriodSchema,
  ReferenceSchema,
} from "./common";

const ServiceRequestOrderIdentifierSchema = IdentifierSchema.extend({
  system: z
    .string()
    .regex(
      /^http:\/\/sys-ids\.kemkes\.go\.id\/servicerequest\/.+$/,
      "ServiceRequest identifier.system must use http://sys-ids.kemkes.go.id/servicerequest/{organization-ihs-number}",
    ),
  value: z.string().min(1),
});

const ServiceRequestAccessionIdentifierSchema = IdentifierSchema.extend({
  system: z
    .string()
    .regex(
      /^http:\/\/sys-ids\.kemkes\.go\.id\/(?:acsn|accessionno)\/.+$/,
      "ServiceRequest accession identifier.system must use http://sys-ids.kemkes.go.id/acsn/{organization-ihs-number}",
    ),
  value: z.string().min(1),
});

export const ServiceRequestIdentifierSchema = z.union([
  ServiceRequestOrderIdentifierSchema,
  ServiceRequestAccessionIdentifierSchema,
]);

export const ServiceRequestStatusSchema = z.enum([
  "draft",
  "active",
  "on-hold",
  "revoked",
  "completed",
  "entered-in-error",
  "unknown",
]);

export const ServiceRequestIntentSchema = z.enum([
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

export const ServiceRequestPrioritySchema = z.enum(["routine", "urgent", "asap", "stat"]);

export const ServiceRequestCodingSchema = z.object({
  system: z.string().min(1),
  code: z.string().min(1),
  display: z.string().optional(),
});

export const ServiceRequestRequiredCodeableConceptSchema = CodeableConceptSchema.extend({
  coding: z.array(ServiceRequestCodingSchema).min(1),
});

export const ServiceRequestQuantitySchema = z.object({
  value: z.union([z.number(), z.string()]),
  unit: z.string().optional(),
  system: z.string().optional(),
  code: z.string().optional(),
});

export const ServiceRequestRangeSchema = z.object({
  low: ServiceRequestQuantitySchema.optional(),
  high: ServiceRequestQuantitySchema.optional(),
});

export const ServiceRequestRatioSchema = z.object({
  numerator: ServiceRequestQuantitySchema.optional(),
  denominator: ServiceRequestQuantitySchema.optional(),
});

export const ServiceRequestNoteSchema = z.object({
  authorReference: ReferenceSchema.optional(),
  authorString: z.string().min(1).optional(),
  time: z.string().optional(),
  text: z.string().min(1),
});

export const ServiceRequestPatchOperationSchema = z.object({
  op: z.literal("replace"),
  path: z.string().min(1),
  value: z.unknown(),
});

export const ServiceRequestPatchSchema = z.array(ServiceRequestPatchOperationSchema).min(1);

export const ServiceRequestSearchParamsSchema = z
  .object({
    subject: z.string().min(1).optional(),
    encounter: z.guid().optional(),
    identifier: z
      .string()
      .regex(
        /^http:\/\/sys-ids\.kemkes\.go\.id\/img-accession-no\/[^|]+\|.+$/,
        "ServiceRequest identifier search must use http://sys-ids.kemkes.go.id/img-accession-no/{subject}|{accession_number}",
      )
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (value.identifier && !value.subject) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ServiceRequest search with "identifier" also requires "subject"',
        path: ["subject"],
      });
      return;
    }

    if (value.subject || value.encounter) {
      return;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Use one ServiceRequest search mode: subject and/or encounter, or subject with identifier",
      path: ["subject"],
    });
  });

export const ServiceRequestBaseSchema = z.object({
  resourceType: z.literal("ServiceRequest"),
  identifier: z.array(ServiceRequestIdentifierSchema).optional(),
  instantiatesCanonical: z.array(z.string().min(1)).optional(),
  instantiatesUri: z.array(z.string().min(1)).optional(),
  basedOn: z.array(ReferenceSchema).optional(),
  replaces: z.array(ReferenceSchema).optional(),
  requisition: IdentifierSchema.optional(),
  status: ServiceRequestStatusSchema,
  intent: ServiceRequestIntentSchema,
  category: z.array(CodeableConceptSchema).optional(),
  priority: ServiceRequestPrioritySchema.optional(),
  doNotPerform: z.boolean().optional(),
  code: ServiceRequestRequiredCodeableConceptSchema,
  orderDetail: z.array(CodeableConceptSchema).optional(),
  quantityQuantity: ServiceRequestQuantitySchema.optional(),
  quantityRatio: ServiceRequestRatioSchema.optional(),
  quantityRange: ServiceRequestRangeSchema.optional(),
  subject: ReferenceSchema,
  encounter: ReferenceSchema.optional(),
  occurrenceDateTime: z.string().optional(),
  occurrencePeriod: PeriodSchema.optional(),
  occurrenceTiming: z.unknown().optional(),
  asNeededBoolean: z.boolean().optional(),
  asNeededCodeableConcept: CodeableConceptSchema.optional(),
  authoredOn: z.string().optional(),
  requester: ReferenceSchema.optional(),
  performerType: CodeableConceptSchema.optional(),
  performer: z.array(ReferenceSchema).optional(),
  locationCode: z.array(CodeableConceptSchema).optional(),
  locationReference: z.array(ReferenceSchema).optional(),
  reasonCode: z.array(CodeableConceptSchema).optional(),
  reasonReference: z.array(ReferenceSchema).optional(),
  insurance: z.array(ReferenceSchema).optional(),
  supportingInfo: z.array(ReferenceSchema).optional(),
  specimen: z.array(ReferenceSchema).optional(),
  bodySite: z.array(CodeableConceptSchema).optional(),
  note: z.array(ServiceRequestNoteSchema).optional(),
  patientInstruction: z.string().optional(),
  relevantHistory: z.array(ReferenceSchema).optional(),
});

export const ServiceRequestCreateSchema = ServiceRequestBaseSchema;

export const ServiceRequestSchema = ServiceRequestBaseSchema.extend({
  id: z.string().min(1),
  meta: MetaSchema.optional(),
});

export const ServiceRequestUpdateParamsSchema = z.object({
  id: z.string().min(1),
});

export const ServiceRequestBundleSchema = createSearchBundleSchema(ServiceRequestSchema);

export type ServiceRequestIdentifier = z.infer<typeof ServiceRequestIdentifierSchema>;
export type ServiceRequestStatus = z.infer<typeof ServiceRequestStatusSchema>;
export type ServiceRequestIntent = z.infer<typeof ServiceRequestIntentSchema>;
export type ServiceRequestPriority = z.infer<typeof ServiceRequestPrioritySchema>;
export type ServiceRequestCoding = z.infer<typeof ServiceRequestCodingSchema>;
export type ServiceRequestQuantity = z.infer<typeof ServiceRequestQuantitySchema>;
export type ServiceRequestRange = z.infer<typeof ServiceRequestRangeSchema>;
export type ServiceRequestRatio = z.infer<typeof ServiceRequestRatioSchema>;
export type ServiceRequestNote = z.infer<typeof ServiceRequestNoteSchema>;
export type ServiceRequestPatchOperation = z.infer<typeof ServiceRequestPatchOperationSchema>;
export type ServiceRequestPatchInput = z.infer<typeof ServiceRequestPatchSchema>;
export type ServiceRequest = z.infer<typeof ServiceRequestSchema>;
export type ServiceRequestCreateInput = z.infer<typeof ServiceRequestCreateSchema>;
export type ServiceRequestSearchParams = z.infer<typeof ServiceRequestSearchParamsSchema>;
export type ServiceRequestSearchResponse = z.infer<typeof ServiceRequestBundleSchema>;

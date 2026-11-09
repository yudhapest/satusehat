import { z } from "zod";

import {
  CodeableConceptSchema,
  ContactPointSchema,
  createSearchBundleSchema,
  IdentifierSchema,
  MetaSchema,
  PeriodSchema,
  ReferenceSchema,
} from "./common";

export const PractitionerRoleAvailableTimeSchema = z.object({
  daysOfWeek: z
    .array(z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]))
    .min(1)
    .optional(),
  allDay: z.boolean().optional(),
  availableStartTime: z.string().optional(),
  availableEndTime: z.string().optional(),
});

export const PractitionerRoleNotAvailableSchema = z.object({
  description: z.string().min(1),
  during: PeriodSchema.optional(),
});

export const PractitionerRolePatchOperationSchema = z.object({
  op: z.literal("replace"),
  path: z.string().min(1),
  value: z.unknown(),
});

export const PractitionerRolePatchSchema = z.array(PractitionerRolePatchOperationSchema).min(1);

export const PractitionerRoleSearchParamsSchema = z.object({
  practitioner: z.string().min(1),
  organization: z.string().min(1).optional(),
});

export const PractitionerRoleBaseSchema = z.object({
  resourceType: z.literal("PractitionerRole"),
  identifier: z.array(IdentifierSchema).optional(),
  active: z.boolean().optional(),
  period: PeriodSchema.optional(),
  practitioner: ReferenceSchema.optional(),
  organization: ReferenceSchema.optional(),
  code: z.array(CodeableConceptSchema).optional(),
  specialty: z.array(CodeableConceptSchema).optional(),
  location: z.array(ReferenceSchema).optional(),
  healthcareService: z.array(ReferenceSchema).optional(),
  telecom: z.array(ContactPointSchema).optional(),
  availableTime: z.array(PractitionerRoleAvailableTimeSchema).optional(),
  notAvailable: z.array(PractitionerRoleNotAvailableSchema).optional(),
  availabilityExceptions: z.string().min(1).optional(),
  endpoint: z.array(ReferenceSchema).optional(),
});

export const PractitionerRoleCreateSchema = PractitionerRoleBaseSchema;

export const PractitionerRoleSchema = PractitionerRoleBaseSchema.extend({
  id: z.string().min(1),
  meta: MetaSchema.optional(),
});

export const PractitionerRoleUpdateParamsSchema = z.object({
  id: z.string().min(1),
});

export const PractitionerRoleBundleSchema = createSearchBundleSchema(PractitionerRoleSchema);

export type PractitionerRoleAvailableTime = z.infer<typeof PractitionerRoleAvailableTimeSchema>;
export type PractitionerRoleNotAvailable = z.infer<typeof PractitionerRoleNotAvailableSchema>;
export type PractitionerRolePatchOperation = z.infer<typeof PractitionerRolePatchOperationSchema>;
export type PractitionerRolePatchInput = z.infer<typeof PractitionerRolePatchSchema>;
export type PractitionerRole = z.infer<typeof PractitionerRoleSchema>;
export type PractitionerRoleCreateInput = z.infer<typeof PractitionerRoleCreateSchema>;
export type PractitionerRoleSearchParams = z.infer<typeof PractitionerRoleSearchParamsSchema>;
export type PractitionerRoleSearchResponse = z.infer<typeof PractitionerRoleBundleSchema>;

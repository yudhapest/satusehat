import { z } from "zod";

import {
  AddressSchema,
  CodeableConceptSchema,
  CodingSchema,
  ContactPointSchema,
  createSearchBundleSchema,
  IdentifierSchema,
  MetaSchema,
  ReferenceSchema,
} from "./common";

export const LocationIdentifierSchema = IdentifierSchema.extend({
  system: z
    .string()
    .regex(
      /^http:\/\/sys-ids\.kemkes\.go\.id\/location\/.+$/,
      "Location identifier.system must use http://sys-ids.kemkes.go.id/location/{organization-ihs-number}",
    ),
  value: z.string().min(1),
});

export const LocationStatusSchema = z.enum(["active", "suspended", "inactive"]);

export const LocationModeSchema = z.enum(["instance", "kind"]);

export const LocationTypeSchema = CodeableConceptSchema.extend({
  coding: z
    .array(
      z.object({
        system: z.string().min(1),
        code: z.string().min(1),
        display: z.string().optional(),
      }),
    )
    .min(1),
});

export const LocationPhysicalTypeSchema = CodeableConceptSchema.extend({
  coding: z
    .array(
      z.object({
        system: z.string().min(1),
        code: z.string().min(1),
        display: z.string().optional(),
      }),
    )
    .min(1),
});

export const LocationPositionSchema = z.object({
  longitude: z.number(),
  latitude: z.number(),
  altitude: z.number().optional(),
});

export const LocationPatchOperationSchema = z.object({
  op: z.literal("replace"),
  path: z.string().min(1),
  value: z.unknown(),
});

export const LocationPatchSchema = z.array(LocationPatchOperationSchema).min(1);

export const LocationHoursOfOperationSchema = z.object({
  daysOfWeek: z
    .array(z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]))
    .min(1)
    .optional(),
  allDay: z.boolean().optional(),
  openingTime: z.string().optional(),
  closingTime: z.string().optional(),
});

export const LocationSearchParamsSchema = z
  .object({
    identifier: z
      .string()
      .regex(
        /^http:\/\/sys-ids\.kemkes\.go\.id\/location\/.+\|.+$/,
        "Location identifier search must use http://sys-ids.kemkes.go.id/location/{parent-location-id}|{location-code}",
      )
      .optional(),
    name: z.string().min(1).optional(),
    organization: z.string().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.identifier || value.name || value.organization) {
      return;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Use at least one Location search parameter: identifier, name, or organization",
      path: ["identifier"],
    });
  });

export const LocationBaseSchema = z.object({
  resourceType: z.literal("Location"),
  identifier: z.array(LocationIdentifierSchema).min(1),
  status: LocationStatusSchema,
  operationalStatus: CodingSchema.optional(),
  name: z.string().min(1),
  alias: z.array(z.string().min(1)).optional(),
  description: z.string().min(1).optional(),
  mode: LocationModeSchema.optional(),
  type: z.array(LocationTypeSchema).optional(),
  telecom: z.array(ContactPointSchema).optional(),
  address: AddressSchema.optional(),
  physicalType: LocationPhysicalTypeSchema.optional(),
  position: LocationPositionSchema.optional(),
  managingOrganization: ReferenceSchema.optional(),
  partOf: ReferenceSchema.optional(),
  hoursOfOperation: z.array(LocationHoursOfOperationSchema).optional(),
  availabilityExceptions: z.string().min(1).optional(),
  endpoint: z.array(ReferenceSchema).optional(),
});

export const LocationCreateSchema = LocationBaseSchema;

export const LocationSchema = LocationBaseSchema.extend({
  id: z.string().min(1),
  meta: MetaSchema.optional(),
});

export const LocationUpdateParamsSchema = z.object({
  id: z.string().min(1),
});

export const LocationBundleSchema = createSearchBundleSchema(LocationSchema);

export type LocationIdentifier = z.infer<typeof LocationIdentifierSchema>;
export type LocationStatus = z.infer<typeof LocationStatusSchema>;
export type LocationMode = z.infer<typeof LocationModeSchema>;
export type LocationType = z.infer<typeof LocationTypeSchema>;
export type LocationPhysicalType = z.infer<typeof LocationPhysicalTypeSchema>;
export type LocationPosition = z.infer<typeof LocationPositionSchema>;
export type LocationHoursOfOperation = z.infer<typeof LocationHoursOfOperationSchema>;
export type LocationPatchOperation = z.infer<typeof LocationPatchOperationSchema>;
export type LocationPatchInput = z.infer<typeof LocationPatchSchema>;
export type Location = z.infer<typeof LocationSchema>;
export type LocationCreateInput = z.infer<typeof LocationCreateSchema>;
export type LocationSearchParams = z.infer<typeof LocationSearchParamsSchema>;
export type LocationSearchResponse = z.infer<typeof LocationBundleSchema>;

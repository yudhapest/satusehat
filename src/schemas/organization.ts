import { z } from "zod";

import {
  AddressSchema,
  CodeableConceptSchema,
  ContactPointSchema,
  createSearchBundleSchema,
  HumanNameSchema,
  IdentifierSchema,
  MetaSchema,
  ReferenceSchema,
} from "./common";

export const OrganizationTypeSchema = CodeableConceptSchema.extend({
  coding: z.array(
    z.object({
      system: z.string().min(1),
      code: z.string().min(1),
      display: z.string().optional(),
    }),
  ).min(1),
});

export const OrganizationIdentifierSchema = IdentifierSchema.extend({
  system: z.string().min(1),
  value: z.string().min(1),
});

export const OrganizationContactSchema = z.object({
  purpose: CodeableConceptSchema.extend({
    coding: z.array(
      z.object({
        system: z.string().min(1),
        code: z.string().min(1),
        display: z.string().optional(),
      }),
    ).min(1),
  }),
  name: HumanNameSchema.optional(),
  telecom: z.array(ContactPointSchema).optional(),
  address: AddressSchema.optional(),
});

export const OrganizationBaseSchema = z.object({
  resourceType: z.literal("Organization"),
  active: z.boolean(),
  identifier: z.array(OrganizationIdentifierSchema).min(1),
  type: z.array(OrganizationTypeSchema).min(1),
  name: z.string().min(1),
  alias: z.array(z.string().min(1)).optional(),
  telecom: z.array(ContactPointSchema).optional(),
  address: z.array(AddressSchema).optional(),
  partOf: ReferenceSchema.optional(),
  contact: z.array(OrganizationContactSchema).optional(),
  endpoint: z.array(ReferenceSchema).optional(),
});

export const OrganizationCreateSchema = OrganizationBaseSchema;

// Responses follow FHIR cardinality (identifier and type are 0..*): parent
// organizations registered by Kemenkes come back with `identifier: []` and no
// `type`. OrganizationCreateSchema keeps both required for outgoing payloads.
export const OrganizationSchema = OrganizationBaseSchema.extend({
  id: z.string().min(1),
  meta: MetaSchema.optional(),
  identifier: z.array(OrganizationIdentifierSchema).optional(),
  type: z.array(OrganizationTypeSchema).optional(),
});

export const OrganizationUpdateParamsSchema = z.object({
  id: z.string().min(1),
});

export const OrganizationSearchParamsSchema = z
  .object({
    name: z.string().min(1).optional(),
    partof: z.string().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.name || value.partof) {
      return;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Use at least one Organization search parameter: name or partof",
      path: ["name"],
    });
  });

export const OrganizationBundleSchema = createSearchBundleSchema(OrganizationSchema);

export type OrganizationIdentifier = z.infer<typeof OrganizationIdentifierSchema>;
export type OrganizationType = z.infer<typeof OrganizationTypeSchema>;
export type OrganizationAddress = z.infer<typeof AddressSchema>;
export type OrganizationTelecom = z.infer<typeof ContactPointSchema>;
export type OrganizationContact = z.infer<typeof OrganizationContactSchema>;
export type OrganizationReference = z.infer<typeof ReferenceSchema>;
export type Organization = z.infer<typeof OrganizationSchema>;
export type OrganizationCreateInput = z.infer<typeof OrganizationCreateSchema>;
export type OrganizationSearchParams = z.infer<typeof OrganizationSearchParamsSchema>;
export type OrganizationSearchResponse = z.infer<typeof OrganizationBundleSchema>;

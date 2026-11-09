import { z } from "zod";

import {
  AddressSchema,
  AttachmentSchema,
  CodeableConceptSchema,
  createSearchBundleSchema,
  HumanNameSchema,
  IdentifierSchema,
  MetaSchema,
  PeriodSchema,
  ReferenceSchema,
} from "./common";

export const PractitionerIdentifierSchema = IdentifierSchema;

export const PractitionerQualificationSchema = z.object({
  identifier: z.array(PractitionerIdentifierSchema).optional(),
  code: CodeableConceptSchema,
  period: PeriodSchema.optional(),
  issuer: ReferenceSchema.optional(),
});

export const PractitionerSchema = z.object({
  resourceType: z.literal("Practitioner"),
  id: z.string().min(1),
  active: z.boolean().optional(),
  identifier: z.array(PractitionerIdentifierSchema).optional(),
  name: z.array(HumanNameSchema).optional(),
  telecom: z.array(
    z.object({
      system: z.enum(["phone", "fax", "email", "pager", "url", "sms", "other"]).optional(),
      value: z.string().optional(),
      use: z.enum(["home", "work", "temp", "old", "mobile"]).optional(),
    }),
  ).optional(),
  address: z.array(AddressSchema).optional(),
  gender: z.enum(["male", "female", "other", "unknown"]).optional(),
  birthDate: z.string().optional(),
  photo: z.array(AttachmentSchema).optional(),
  qualification: z.array(PractitionerQualificationSchema).optional(),
  communication: z.array(CodeableConceptSchema).optional(),
  meta: MetaSchema.optional(),
});

export const PractitionerSearchParamsSchema = z
  .object({
    identifier: z
      .string()
      .regex(/^https:\/\/fhir\.kemkes\.go\.id\/id\/nik\|.+$/, "Invalid SATUSEHAT practitioner identifier format")
      .optional(),
    name: z.string().min(1).optional(),
    birthdate: z
      .string()
      .regex(/^\d{4}(-\d{2}){0,2}$/, "birthdate must use YYYY, YYYY-MM, or YYYY-MM-DD format")
      .optional(),
    gender: z.enum(["male", "female"]).optional(),
  })
  .superRefine((value, ctx) => {
    const hasIdentifier = Boolean(value.identifier);
    const hasNameBirthdateGender = Boolean(value.name && value.birthdate && value.gender);

    if (hasIdentifier || hasNameBirthdateGender) {
      return;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Use one SATUSEHAT practitioner search mode: identifier or name+birthdate+gender",
      path: ["identifier"],
    });
  });

export const PractitionerBundleSchema = createSearchBundleSchema(PractitionerSchema);

export type PractitionerIdentifier = z.infer<typeof PractitionerIdentifierSchema>;
export type PractitionerQualification = z.infer<typeof PractitionerQualificationSchema>;
export type Practitioner = z.infer<typeof PractitionerSchema>;
export type PractitionerSearchParams = z.infer<typeof PractitionerSearchParamsSchema>;
export type PractitionerSearchResponse = z.infer<typeof PractitionerBundleSchema>;

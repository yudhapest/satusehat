import { z } from "zod";

import {
  createSearchBundleSchema,
  HumanNameSchema,
  IdentifierSchema,
  MetaSchema,
} from "./common";

export const PatientIdentifierSchema = IdentifierSchema;

export const PatientSchema = z.object({
  resourceType: z.literal("Patient"),
  id: z.string(),
  active: z.boolean().optional(),
  birthDate: z.string().optional(),
  gender: z.enum(["male", "female", "other", "unknown"]).optional(),
  identifier: z.array(PatientIdentifierSchema).optional(),
  meta: MetaSchema.optional(),
  name: z.array(HumanNameSchema).optional(),
});

export const PatientSearchParamsSchema = z
  .object({
    identifier: z
      .string()
      .regex(/^https:\/\/fhir\.kemkes\.go\.id\/id\/(nik|nik-ibu)\|.+$/, "Invalid SATUSEHAT identifier format")
      .optional(),
    name: z.string().min(3).optional(),
    birthdate: z
      .string()
      .regex(/^\d{4}(-\d{2}){0,2}$/, "birthdate must use YYYY, YYYY-MM, or YYYY-MM-DD format")
      .optional(),
    gender: z.enum(["male", "female"]).optional(),
    nik: z.string().regex(/^\d{16}$/, "nik must contain 16 digits").optional(),
  })
  .superRefine((value, ctx) => {
    const hasIdentifier = Boolean(value.identifier);
    const hasNameBirthdateNik = Boolean(value.name && value.birthdate && value.nik);
    const hasNameBirthdateGender = Boolean(value.name && value.birthdate && value.gender);

    if (hasIdentifier || hasNameBirthdateNik || hasNameBirthdateGender) {
      return;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Use one SATUSEHAT patient search mode: identifier, name+birthdate+nik, or name+birthdate+gender",
      path: ["identifier"],
    });
  });

export const PatientBundleSchema = createSearchBundleSchema(PatientSchema);

export type PatientIdentifier = z.infer<typeof PatientIdentifierSchema>;
export type Patient = z.infer<typeof PatientSchema>;
export type PatientSearchParams = z.infer<typeof PatientSearchParamsSchema>;
export type PatientSearchResponse = z.infer<typeof PatientBundleSchema>;

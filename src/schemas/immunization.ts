import { z } from "zod";

import {
  CodeableConceptSchema,
  createSearchBundleSchema,
  IdentifierSchema,
  MetaSchema,
  ReferenceSchema,
} from "./common";

export const ImmunizationIdentifierSchema = IdentifierSchema.extend({
  value: z.string().min(1),
});

export const ImmunizationStatusSchema = z.enum([
  "completed",
  "entered-in-error",
  "not-done",
]);

export const ImmunizationQuantitySchema = z.object({
  value: z.union([z.number(), z.string()]),
  unit: z.string().optional(),
  system: z.string().optional(),
  code: z.string().optional(),
});

export const ImmunizationPerformerSchema = z.object({
  function: CodeableConceptSchema.optional(),
  actor: ReferenceSchema,
});

export const ImmunizationNoteSchema = z.object({
  authorReference: ReferenceSchema.optional(),
  authorString: z.string().min(1).optional(),
  time: z.string().optional(),
  text: z.string().min(1),
});

export const ImmunizationEducationSchema = z.object({
  documentType: z.string().min(1).optional(),
  reference: z.string().min(1).optional(),
  publicationDate: z.string().optional(),
  presentationDate: z.string().optional(),
});

export const ImmunizationReactionSchema = z.object({
  date: z.string().optional(),
  detail: ReferenceSchema.optional(),
  reported: z.boolean().optional(),
});

export const ImmunizationProtocolAppliedSchema = z.object({
  series: z.string().min(1).optional(),
  authority: ReferenceSchema.optional(),
  targetDisease: z.array(CodeableConceptSchema).optional(),
  doseNumberPositiveInt: z.number().int().positive().optional(),
  doseNumberString: z.string().min(1).optional(),
  seriesDosesPositiveInt: z.number().int().positive().optional(),
  seriesDosesString: z.string().min(1).optional(),
});

export const ImmunizationPatchOperationSchema = z.object({
  op: z.literal("replace"),
  path: z.string().min(1),
  value: z.unknown(),
});

export const ImmunizationPatchSchema = z.array(ImmunizationPatchOperationSchema).min(1);

export const ImmunizationSearchParamsSchema = z
  .object({
    patient: z.string().min(1).optional(),
    encounter: z.string().min(1).optional(),
    date: z.string().min(1).optional(),
    status: ImmunizationStatusSchema.optional(),
    identifier: z.string().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.patient || value.encounter || value.date || value.status || value.identifier) {
      return;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Use at least one Immunization search parameter: patient, encounter, date, status, or identifier",
      path: ["patient"],
    });
  });

const ImmunizationBaseObjectSchema = z.object({
  resourceType: z.literal("Immunization"),
  identifier: z.array(ImmunizationIdentifierSchema).optional(),
  status: ImmunizationStatusSchema,
  statusReason: CodeableConceptSchema.optional(),
  vaccineCode: CodeableConceptSchema,
  patient: ReferenceSchema,
  encounter: ReferenceSchema.optional(),
  occurrenceDateTime: z.string().optional(),
  occurrenceString: z.string().optional(),
  recorded: z.string().optional(),
  primarySource: z.boolean().optional(),
  reportOrigin: CodeableConceptSchema.optional(),
  location: ReferenceSchema.optional(),
  manufacturer: ReferenceSchema.optional(),
  lotNumber: z.string().min(1).optional(),
  expirationDate: z.string().optional(),
  site: CodeableConceptSchema.optional(),
  route: CodeableConceptSchema.optional(),
  doseQuantity: ImmunizationQuantitySchema.optional(),
  performer: z.array(ImmunizationPerformerSchema).optional(),
  note: z.array(ImmunizationNoteSchema).optional(),
  reasonCode: z.array(CodeableConceptSchema).optional(),
  reasonReference: z.array(ReferenceSchema).optional(),
  isSubpotent: z.boolean().optional(),
  subpotentReason: z.array(CodeableConceptSchema).optional(),
  education: z.array(ImmunizationEducationSchema).optional(),
  programEligibility: z.array(CodeableConceptSchema).optional(),
  fundingSource: CodeableConceptSchema.optional(),
  reaction: z.array(ImmunizationReactionSchema).optional(),
  protocolApplied: z.array(ImmunizationProtocolAppliedSchema).optional(),
});

function validateImmunizationInvariants(
  value: z.infer<typeof ImmunizationBaseObjectSchema>,
  ctx: z.RefinementCtx,
) {
  const hasOccurrenceDateTime = Boolean(value.occurrenceDateTime);
  const hasOccurrenceString = Boolean(value.occurrenceString);

  if (!hasOccurrenceDateTime && !hasOccurrenceString) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Immunization requires either occurrenceDateTime or occurrenceString",
      path: ["occurrenceDateTime"],
    });
  }

  if (hasOccurrenceDateTime && hasOccurrenceString) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Immunization accepts only one of occurrenceDateTime or occurrenceString",
      path: ["occurrenceString"],
    });
  }

  if (value.status === "completed" && !value.reasonCode?.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Immunization with completed status requires reasonCode for SATUSEHAT",
      path: ["reasonCode"],
    });
  }

  if (value.expirationDate && value.occurrenceDateTime) {
    const expirationDate = parseFhirDateToUtcDate(value.expirationDate);
    const occurrenceDate = parseFhirDateToUtcDate(value.occurrenceDateTime);

    if (expirationDate !== undefined && occurrenceDate !== undefined && expirationDate < occurrenceDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Immunization expirationDate cannot be before occurrenceDateTime",
        path: ["expirationDate"],
      });
    }
  }
}

function parseFhirDateToUtcDate(input: string): number | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(input);

  if (!match) {
    return undefined;
  }

  const [, year, month, day] = match;

  return Date.UTC(Number(year), Number(month) - 1, Number(day));
}

export const ImmunizationCreateSchema =
  ImmunizationBaseObjectSchema.superRefine(validateImmunizationInvariants);

export const ImmunizationSchema = ImmunizationBaseObjectSchema.extend({
  id: z.string().min(1),
  meta: MetaSchema.optional(),
}).superRefine(validateImmunizationInvariants);

export const ImmunizationUpdateParamsSchema = z.object({
  id: z.string().min(1),
});

export const ImmunizationBundleSchema = createSearchBundleSchema(ImmunizationSchema);

export type ImmunizationIdentifier = z.infer<typeof ImmunizationIdentifierSchema>;
export type ImmunizationStatus = z.infer<typeof ImmunizationStatusSchema>;
export type ImmunizationQuantity = z.infer<typeof ImmunizationQuantitySchema>;
export type ImmunizationPerformer = z.infer<typeof ImmunizationPerformerSchema>;
export type ImmunizationNote = z.infer<typeof ImmunizationNoteSchema>;
export type ImmunizationEducation = z.infer<typeof ImmunizationEducationSchema>;
export type ImmunizationReaction = z.infer<typeof ImmunizationReactionSchema>;
export type ImmunizationProtocolApplied = z.infer<
  typeof ImmunizationProtocolAppliedSchema
>;
export type ImmunizationPatchOperation = z.infer<
  typeof ImmunizationPatchOperationSchema
>;
export type ImmunizationPatchInput = z.infer<typeof ImmunizationPatchSchema>;
export type Immunization = z.infer<typeof ImmunizationSchema>;
export type ImmunizationCreateInput = z.infer<typeof ImmunizationCreateSchema>;
export type ImmunizationSearchParams = z.infer<typeof ImmunizationSearchParamsSchema>;
export type ImmunizationSearchResponse = z.infer<typeof ImmunizationBundleSchema>;

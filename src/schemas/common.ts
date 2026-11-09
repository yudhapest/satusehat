import { z } from "zod";

export const MetaSchema = z.object({
  lastUpdated: z.string().optional(),
  profile: z.array(z.string()).optional(),
  versionId: z.string().optional(),
});

export const PeriodSchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
});

export const CodingSchema = z.object({
  system: z.string().optional(),
  code: z.string().optional(),
  display: z.string().optional(),
});

export const CodeableConceptSchema = z.object({
  coding: z.array(CodingSchema).optional(),
  text: z.string().optional(),
});

export const IdentifierSchema = z.object({
  system: z.string().optional(),
  use: z.string().optional(),
  type: CodeableConceptSchema.optional(),
  value: z.string().optional(),
});

export const HumanNameSchema = z.object({
  use: z.string().optional(),
  text: z.string().optional(),
  family: z.string().optional(),
  given: z.array(z.string()).optional(),
  prefix: z.array(z.string()).optional(),
  suffix: z.array(z.string()).optional(),
});

export const ContactPointSchema = z.object({
  system: z.enum(["phone", "fax", "email", "pager", "url", "sms", "other"]).optional(),
  value: z.string().optional(),
  use: z.enum(["home", "work", "temp", "old", "mobile"]).optional(),
});

export const ExtensionValueCodeSchema = z.object({
  url: z.string().min(1),
  valueCode: z.string().min(1),
});

export const ExtensionSchema = z.object({
  url: z.string().min(1),
  extension: z.array(ExtensionValueCodeSchema).optional(),
});

export const AddressSchema = z.object({
  use: z.enum(["home", "work", "temp", "old", "billing"]).optional(),
  type: z.enum(["postal", "physical", "both"]).optional(),
  text: z.string().optional(),
  line: z.array(z.string().min(1)).optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  period: PeriodSchema.optional(),
  extension: z.array(ExtensionSchema).optional(),
});

export const AttachmentSchema = z.object({
  contentType: z.string().optional(),
  language: z.string().optional(),
  data: z.string().optional(),
  url: z.string().optional(),
  size: z.number().optional(),
  hash: z.string().optional(),
  title: z.string().optional(),
  creation: z.string().optional(),
});

export const ReferenceSchema = z.object({
  reference: z.string().min(1),
  display: z.string().optional(),
  type: z.string().optional(),
});

export type Reference = z.infer<typeof ReferenceSchema>;

export const BundleLinkSchema = z.object({
  relation: z.string().optional(),
  url: z.string().optional(),
});

export const BundleSearchSchema = z.object({
  mode: z.string().optional(),
});

export const BundleEntrySchema = <TResource extends z.ZodTypeAny>(resourceSchema: TResource) =>
  z.object({
    fullUrl: z.string().optional(),
    resource: resourceSchema,
    search: BundleSearchSchema.optional(),
  });

export const OperationOutcomeIssueSchema = z.object({
  severity: z.string().min(1),
  code: z.string().min(1),
  details: CodeableConceptSchema.optional(),
  diagnostics: z.string().optional(),
  expression: z.array(z.string()).optional(),
});

export const OperationOutcomeSchema = z.object({
  resourceType: z.literal("OperationOutcome"),
  id: z.string().optional(),
  issue: z.array(OperationOutcomeIssueSchema),
});

function isOperationOutcomeEntry(entry: unknown): boolean {
  if (typeof entry !== "object" || entry === null) {
    return false;
  }

  const resource = (entry as { resource?: unknown }).resource;

  return (
    typeof resource === "object" &&
    resource !== null &&
    (resource as { resourceType?: unknown }).resourceType === "OperationOutcome"
  );
}

// SATUSEHAT mixes OperationOutcome entries (for example, results suppressed by
// consent rules) into search bundles. Move their resources to `outcomes` so
// `entry` only holds the searched resource type.
function splitOutcomeEntries(bundle: unknown): unknown {
  if (typeof bundle !== "object" || bundle === null) {
    return bundle;
  }

  const entries = (bundle as { entry?: unknown }).entry;

  if (!Array.isArray(entries) || !entries.some(isOperationOutcomeEntry)) {
    return bundle;
  }

  return {
    ...bundle,
    entry: entries.filter((entry) => !isOperationOutcomeEntry(entry)),
    outcomes: entries
      .filter(isOperationOutcomeEntry)
      .map((entry) => (entry as { resource: unknown }).resource),
  };
}

export const createSearchBundleSchema = <TResource extends z.ZodTypeAny>(
  resourceSchema: TResource,
) =>
  z.preprocess(
    splitOutcomeEntries,
    z.object({
      resourceType: z.literal("Bundle"),
      type: z.string().optional(),
      total: z.number().optional(),
      link: z.array(BundleLinkSchema).optional(),
      entry: z.array(BundleEntrySchema(resourceSchema)).optional(),
      outcomes: z.array(OperationOutcomeSchema).optional(),
    }),
  );

export type OperationOutcomeIssue = z.infer<typeof OperationOutcomeIssueSchema>;
export type OperationOutcome = z.infer<typeof OperationOutcomeSchema>;

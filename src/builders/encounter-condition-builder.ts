import { ConditionCreateSchema } from "../schemas/condition";
import { EncounterDiagnosisSchema } from "../schemas/encounter";
import type { Reference } from "../schemas/common";
import type {
  ConditionCreateInput,
  ConditionNote,
} from "../schemas/condition";
import type { EncounterDiagnosis } from "../schemas/encounter";

const DEFAULT_CONDITION_CATEGORY = {
  coding: [
    {
      system: "http://terminology.hl7.org/CodeSystem/condition-category",
      code: "encounter-diagnosis",
      display: "Encounter Diagnosis",
    },
  ],
} satisfies NonNullable<ConditionCreateInput["category"]>[number];

const DEFAULT_ENCOUNTER_DIAGNOSIS_USE = {
  coding: [
    {
      system: "http://terminology.hl7.org/CodeSystem/diagnosis-role",
      code: "AD",
      display: "Admission diagnosis",
    },
  ],
} satisfies EncounterDiagnosis["use"];

type ConditionMutableInput = Partial<
  Omit<ConditionCreateInput, "resourceType" | "subject" | "encounter">
>;

export interface EncounterConditionBuilderInput {
  subject: Reference;
  encounter: Reference;
  condition: Pick<ConditionCreateInput, "code"> & ConditionMutableInput;
}

export interface EncounterDiagnosisBuildLinks {
  conditionId?: string;
  conditionReference?: Reference;
  use?: EncounterDiagnosis["use"];
  rank?: number;
}

export function createEncounterDiagnosis(
  links: EncounterDiagnosisBuildLinks,
): EncounterDiagnosis {
  return EncounterDiagnosisSchema.parse({
    condition: resolveConditionReference(links),
    use: links.use ?? DEFAULT_ENCOUNTER_DIAGNOSIS_USE,
    rank: links.rank ?? 1,
  });
}

export class EncounterConditionBuilder {
  private conditionDraft: ConditionCreateInput;

  public constructor(input: EncounterConditionBuilderInput) {
    this.conditionDraft = createConditionDraft({
      subject: input.subject,
      encounter: input.encounter,
      condition: input.condition,
    });
  }

  public setSubject(subject: Reference): this {
    this.conditionDraft.subject = subject;
    return this;
  }

  public setEncounter(encounter: Reference): this {
    this.conditionDraft.encounter = encounter;
    return this;
  }

  public mergeCondition(input: ConditionMutableInput): this {
    this.conditionDraft = ConditionCreateSchema.parse({
      ...this.conditionDraft,
      ...input,
    });
    return this;
  }

  public addCategory(category: NonNullable<ConditionCreateInput["category"]>[number]): this {
    this.conditionDraft.category = [...(this.conditionDraft.category ?? []), category];
    return this;
  }

  public addNote(note: ConditionNote): this {
    this.conditionDraft.note = [...(this.conditionDraft.note ?? []), note];
    return this;
  }

  public buildCondition(): ConditionCreateInput {
    return ConditionCreateSchema.parse(this.conditionDraft);
  }

  public buildEncounterDiagnosis(links: EncounterDiagnosisBuildLinks = {}): EncounterDiagnosis {
    return createEncounterDiagnosis(links);
  }
}

export function createEncounterConditionBuilder(
  input: EncounterConditionBuilderInput,
): EncounterConditionBuilder {
  return new EncounterConditionBuilder(input);
}

function createConditionDraft(input: EncounterConditionBuilderInput): ConditionCreateInput {
  const { category, ...condition } = input.condition;

  return ConditionCreateSchema.parse({
    resourceType: "Condition",
    subject: input.subject,
    encounter: input.encounter,
    ...condition,
    category: category ?? [DEFAULT_CONDITION_CATEGORY],
  });
}

function resolveConditionReference(links: EncounterDiagnosisBuildLinks): Reference {
  if (links.conditionReference) {
    return links.conditionReference;
  }

  if (links.conditionId) {
    return {
      reference: `Condition/${links.conditionId}`,
    };
  }

  throw new Error(
    "Condition link is required. Provide conditionId or conditionReference before building Encounter diagnosis.",
  );
}

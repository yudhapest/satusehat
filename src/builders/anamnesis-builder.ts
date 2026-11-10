import {
  ALLERGY_INTOLERANCE_CLINICAL_STATUSES,
  ALLERGY_INTOLERANCE_REACTION_MANIFESTATIONS,
  ALLERGY_INTOLERANCE_VERIFICATION_STATUSES,
  type AllergyIntoleranceClinicalStatusCode,
  type AllergyIntoleranceReactionManifestationCode,
  type AllergyIntoleranceVerificationStatusCode,
} from "../schemas/allergy-intolerance-terminology";
import { AllergyIntoleranceCreateSchema } from "../schemas/allergy-intolerance";
import { KFA_SYSTEM, SNOMED_CT_SYSTEM } from "../schemas/common-terminology";
import {
  CONDITION_CATEGORIES,
  CONDITION_CLINICAL_STATUSES,
  CONDITION_VERIFICATION_STATUSES,
  type ConditionCategoryCode,
  type ConditionClinicalStatusCode,
  type ConditionVerificationStatusCode,
} from "../schemas/condition-terminology";
import { ConditionCreateSchema } from "../schemas/condition";
import { FAMILY_MEMBER_RELATIONSHIPS } from "../schemas/family-member-history-terminology";
import { FamilyMemberHistoryCreateSchema } from "../schemas/family-member-history";
import {
  MEDICATION_STATEMENT_CATEGORIES,
  type MedicationStatementCategoryCode,
} from "../schemas/medication-statement-terminology";
import { MedicationStatementCreateSchema } from "../schemas/medication-statement";
import { createEncounterDiagnosisUse } from "./encounter-builder";
import { createEncounterDiagnosis } from "./encounter-condition-builder";
import type { AllergyIntoleranceCreateInput } from "../schemas/allergy-intolerance";
import type { Reference } from "../schemas/common";
import type { ConditionCreateInput } from "../schemas/condition";
import type { EncounterDiagnosis } from "../schemas/encounter";
import type {
  FamilyMemberHistoryCondition,
  FamilyMemberHistoryCreateInput,
  FamilyMemberHistoryStatus,
} from "../schemas/family-member-history";
import type {
  MedicationStatementCreateInput,
  MedicationStatementStatus,
} from "../schemas/medication-statement";

/** A coded value. `system` defaults to SNOMED CT. */
export interface AnamnesisCodingInput {
  system?: string;
  code: string;
  display?: string;
}

export interface AnamnesisContext {
  /** Patient/{ihs-number} */
  subject: Reference;
  /** Encounter/{id} of the visit the anamnesis belongs to */
  encounter: Reference;
  /** Practitioner/{ihs-number} who records the anamnesis (required for Riwayat Alergi) */
  recorder?: Reference;
  /** Defaults to no recordedDate */
  recordedDate?: string;
}

interface AnamnesisNoteInput {
  note?: string;
}

export interface AnamnesisComplaintInput extends AnamnesisNoteInput {
  /** SNOMED CT clinical finding (<< 404684003 |Clinical finding|) */
  code: AnamnesisCodingInput;
  onsetDateTime?: string;
  clinicalStatus?: ConditionClinicalStatusCode;
  verificationStatus?: ConditionVerificationStatusCode;
}

export interface AnamnesisPersonalHistoryInput extends AnamnesisNoteInput {
  /**
   * SNOMED CT history finding (<< 417662000 |History of clinical finding in subject| or
   * << 443508001 |No history of clinical finding in subject|)
   */
  code: AnamnesisCodingInput;
  /** "active" when the condition is ongoing, "inactive" when it has ended */
  clinicalStatus: Extract<ConditionClinicalStatusCode, "active" | "inactive">;
  onsetDateTime?: string;
}

export interface AnamnesisFamilyConditionInput extends AnamnesisNoteInput {
  /**
   * SNOMED CT family history (<< 416471007 or << 160266009) or a Kemenkes code from
   * FAMILY_MEMBER_HISTORY_CONDITIONS
   */
  code: AnamnesisCodingInput;
  /** SNOMED CT patient condition finding (<< 418138009) */
  outcome?: AnamnesisCodingInput;
  contributedToDeath?: boolean;
  onsetAge?: FamilyMemberHistoryCondition["onsetAge"];
  onsetRange?: FamilyMemberHistoryCondition["onsetRange"];
  onsetPeriod?: FamilyMemberHistoryCondition["onsetPeriod"];
  onsetString?: string;
}

export interface AnamnesisFamilyHistoryInput extends AnamnesisNoteInput {
  conditions: [AnamnesisFamilyConditionInput, ...AnamnesisFamilyConditionInput[]];
  /** Defaults to FAMMEMB (Family member) */
  relationship?: AnamnesisCodingInput;
  /** Defaults to "completed" */
  status?: FamilyMemberHistoryStatus;
  name?: string;
  deceasedBoolean?: boolean;
  date?: string;
}

/**
 * A reaction manifestation: a code from ALLERGY_INTOLERANCE_REACTION_MANIFESTATIONS, an explicit
 * coding, or `{ text }`. The SATUSEHAT sandbox currently rejects every coding system on
 * reaction.manifestation (RuleNumber 11149) and only accepts text.
 */
export type AnamnesisAllergyManifestationInput =
  AllergyIntoleranceReactionManifestationCode | AnamnesisCodingInput | { text: string };

export interface AnamnesisAllergyReactionInput {
  manifestation: [AnamnesisAllergyManifestationInput, ...AnamnesisAllergyManifestationInput[]];
  severity?: "mild" | "moderate" | "severe";
  description?: string;
}

export interface AnamnesisAllergyInput extends AnamnesisNoteInput {
  category: [
    "food" | "medication" | "environment" | "biologic",
    ...("food" | "medication" | "environment" | "biologic")[],
  ];
  /** KFA (drugs, vaccines), WHO ATC (drug classes), or SNOMED CT (food, environment) */
  code: AnamnesisCodingInput;
  /** Defaults to "active" */
  clinicalStatus?: AllergyIntoleranceClinicalStatusCode;
  verificationStatus?: AllergyIntoleranceVerificationStatusCode;
  type?: "allergy" | "intolerance";
  criticality?: "low" | "high" | "unable-to-assess";
  onsetDateTime?: string;
  reaction?: AnamnesisAllergyReactionInput[];
}

export type AnamnesisMedicationInput =
  | {
      /** Drug from outside the facility: KFA 93xxxxxx (brand known) or 92xxxxxx (generic) */
      kfa: { code: string; display: string };
    }
  | {
      /**
       * Drug dispensed by the same facility: reference to its Medication ("Medication/{id}"), or
       * "#id" pointing to a resource in `contained`
       */
      reference: string;
      contained?: MedicationStatementCreateInput["contained"];
    };

export interface AnamnesisMedicationHistoryInput extends AnamnesisNoteInput {
  medication: AnamnesisMedicationInput;
  status: MedicationStatementStatus;
  category?: MedicationStatementCategoryCode;
  effectiveDateTime?: string;
  effectivePeriod?: MedicationStatementCreateInput["effectivePeriod"];
  dateAsserted?: string;
  dosage?: MedicationStatementCreateInput["dosage"];
}

function toCoding(input: AnamnesisCodingInput) {
  return {
    system: input.system ?? SNOMED_CT_SYSTEM,
    code: input.code,
    ...(input.display ? { display: input.display } : {}),
  };
}

function toCodeableConcept(input: AnamnesisCodingInput) {
  return { coding: [toCoding(input)] };
}

function fromTable<TCode extends string>(
  table: Record<TCode, { system: string; display: string }>,
  code: TCode,
) {
  const { system, display } = table[code];
  return { coding: [{ system, code, display }] };
}

function toNote(note: string | undefined) {
  return note ? { note: [{ text: note }] } : {};
}

/**
 * Builds the SATUSEHAT anamnesis payloads (Pengiriman Data Anamnesis) for Rawat Jalan, IGD, and
 * Rawat Inap: keluhan utama, keluhan penyerta, riwayat penyakit pribadi, riwayat penyakit
 * keluarga, riwayat alergi, and riwayat pengobatan. Every builder returns a validated payload;
 * send it with the matching client (condition, familyMemberHistory, allergyIntolerance,
 * medicationStatement).
 */
export class AnamnesisBuilder {
  public constructor(private readonly context: AnamnesisContext) {}

  /** Keluhan Utama: Condition with category chief-complaint. */
  public buildChiefComplaint(input: AnamnesisComplaintInput): ConditionCreateInput {
    return this.buildCondition("chief-complaint", input);
  }

  /** Keluhan Penyerta: Condition with category problem-list-item. */
  public buildAccompanyingComplaint(input: AnamnesisComplaintInput): ConditionCreateInput {
    return this.buildCondition("problem-list-item", input);
  }

  /** Riwayat Penyakit Pribadi: Condition with category previous-condition. */
  public buildPersonalHistory(input: AnamnesisPersonalHistoryInput): ConditionCreateInput {
    return this.buildCondition("previous-condition", input);
  }

  /**
   * Encounter.diagnosis entry for a keluhan utama (use CC). Add it to the Encounter before the
   * PUT that finishes the visit.
   */
  public buildChiefComplaintDiagnosis(conditionId: string, rank?: number): EncounterDiagnosis {
    return createEncounterDiagnosis({
      conditionId,
      use: createEncounterDiagnosisUse("CC"),
      ...(rank !== undefined ? { rank } : {}),
    });
  }

  /** Riwayat Penyakit Keluarga: FamilyMemberHistory. */
  public buildFamilyHistory(input: AnamnesisFamilyHistoryInput): FamilyMemberHistoryCreateInput {
    return FamilyMemberHistoryCreateSchema.parse({
      resourceType: "FamilyMemberHistory",
      status: input.status ?? "completed",
      patient: this.context.subject,
      ...(input.date ? { date: input.date } : {}),
      ...(input.name ? { name: input.name } : {}),
      relationship: input.relationship
        ? toCodeableConcept(input.relationship)
        : fromTable(FAMILY_MEMBER_RELATIONSHIPS, "FAMMEMB"),
      ...(input.deceasedBoolean !== undefined ? { deceasedBoolean: input.deceasedBoolean } : {}),
      ...toNote(input.note),
      condition: input.conditions.map((condition) => ({
        code: toCodeableConcept(condition.code),
        ...(condition.outcome ? { outcome: toCodeableConcept(condition.outcome) } : {}),
        ...(condition.contributedToDeath !== undefined
          ? { contributedToDeath: condition.contributedToDeath }
          : {}),
        ...(condition.onsetAge ? { onsetAge: condition.onsetAge } : {}),
        ...(condition.onsetRange ? { onsetRange: condition.onsetRange } : {}),
        ...(condition.onsetPeriod ? { onsetPeriod: condition.onsetPeriod } : {}),
        ...(condition.onsetString ? { onsetString: condition.onsetString } : {}),
        ...toNote(condition.note),
      })),
    });
  }

  /** Riwayat Alergi: AllergyIntolerance. Requires `recorder` in the context. */
  public buildAllergy(input: AnamnesisAllergyInput): AllergyIntoleranceCreateInput {
    if (!this.context.recorder) {
      throw new Error("AnamnesisBuilder needs a recorder (Practitioner) to build Riwayat Alergi");
    }

    return AllergyIntoleranceCreateSchema.parse({
      resourceType: "AllergyIntolerance",
      clinicalStatus: fromTable(
        ALLERGY_INTOLERANCE_CLINICAL_STATUSES,
        input.clinicalStatus ?? "active",
      ),
      ...(input.verificationStatus
        ? {
            verificationStatus: fromTable(
              ALLERGY_INTOLERANCE_VERIFICATION_STATUSES,
              input.verificationStatus,
            ),
          }
        : {}),
      ...(input.type ? { type: input.type } : {}),
      category: input.category,
      ...(input.criticality ? { criticality: input.criticality } : {}),
      code: toCodeableConcept(input.code),
      patient: this.context.subject,
      encounter: this.context.encounter,
      ...(input.onsetDateTime ? { onsetDateTime: input.onsetDateTime } : {}),
      ...(this.context.recordedDate ? { recordedDate: this.context.recordedDate } : {}),
      recorder: this.context.recorder,
      ...toNote(input.note),
      ...(input.reaction
        ? {
            reaction: input.reaction.map((reaction) => ({
              manifestation: reaction.manifestation.map((manifestation) => {
                if (typeof manifestation === "string") {
                  return fromTable(ALLERGY_INTOLERANCE_REACTION_MANIFESTATIONS, manifestation);
                }

                return "code" in manifestation
                  ? toCodeableConcept(manifestation)
                  : { text: manifestation.text };
              }),
              ...(reaction.severity ? { severity: reaction.severity } : {}),
              ...(reaction.description ? { description: reaction.description } : {}),
            })),
          }
        : {}),
    });
  }

  /** Riwayat Pengobatan: MedicationStatement linked to the encounter (context). */
  public buildMedicationHistory(
    input: AnamnesisMedicationHistoryInput,
  ): MedicationStatementCreateInput {
    const medication =
      "kfa" in input.medication
        ? {
            medicationCodeableConcept: {
              coding: [{ system: KFA_SYSTEM, ...input.medication.kfa }],
            },
          }
        : {
            ...(input.medication.contained ? { contained: input.medication.contained } : {}),
            medicationReference: { reference: input.medication.reference },
          };

    return MedicationStatementCreateSchema.parse({
      resourceType: "MedicationStatement",
      status: input.status,
      ...(input.category
        ? { category: fromTable(MEDICATION_STATEMENT_CATEGORIES, input.category) }
        : {}),
      ...medication,
      subject: this.context.subject,
      context: this.context.encounter,
      ...(input.effectiveDateTime ? { effectiveDateTime: input.effectiveDateTime } : {}),
      ...(input.effectivePeriod ? { effectivePeriod: input.effectivePeriod } : {}),
      ...(input.dateAsserted ? { dateAsserted: input.dateAsserted } : {}),
      ...(this.context.recorder ? { informationSource: this.context.recorder } : {}),
      ...toNote(input.note),
      ...(input.dosage ? { dosage: input.dosage } : {}),
    });
  }

  private buildCondition(
    category: ConditionCategoryCode,
    input: AnamnesisComplaintInput | AnamnesisPersonalHistoryInput,
  ): ConditionCreateInput {
    return ConditionCreateSchema.parse({
      resourceType: "Condition",
      ...(input.clinicalStatus
        ? { clinicalStatus: fromTable(CONDITION_CLINICAL_STATUSES, input.clinicalStatus) }
        : {}),
      ...("verificationStatus" in input && input.verificationStatus
        ? {
            verificationStatus: fromTable(
              CONDITION_VERIFICATION_STATUSES,
              input.verificationStatus,
            ),
          }
        : {}),
      category: [fromTable(CONDITION_CATEGORIES, category)],
      code: toCodeableConcept(input.code),
      subject: this.context.subject,
      encounter: this.context.encounter,
      ...(input.onsetDateTime ? { onsetDateTime: input.onsetDateTime } : {}),
      ...(this.context.recordedDate ? { recordedDate: this.context.recordedDate } : {}),
      ...(this.context.recorder ? { recorder: this.context.recorder } : {}),
      ...toNote(input.note),
    });
  }
}

export function createAnamnesisBuilder(context: AnamnesisContext): AnamnesisBuilder {
  return new AnamnesisBuilder(context);
}

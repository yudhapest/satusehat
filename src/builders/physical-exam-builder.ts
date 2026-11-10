import { LOINC_SYSTEM, SNOMED_CT_SYSTEM, UCUM_SYSTEM } from "../schemas/common-terminology";
import {
  OBSERVATION_ARRIVAL_TRANSPORT_CODE,
  OBSERVATION_ARRIVAL_TRANSPORT_MODES,
  OBSERVATION_CATEGORIES,
  OBSERVATION_CONSCIOUSNESS_CODE,
  OBSERVATION_CONSCIOUSNESS_LEVELS,
  OBSERVATION_HEAD_TO_TOE_EXAMS,
  OBSERVATION_MEASUREMENTS,
  OBSERVATION_REFERRAL_LETTER_CODE,
  OBSERVATION_TRIAGE_CODE,
  OBSERVATION_TRIAGE_LEVELS,
  type ObservationArrivalTransportMode,
  type ObservationCategoryCode,
  type ObservationConsciousnessLevel,
  type ObservationHeadToToeDefinition,
  type ObservationHeadToToeSite,
  type ObservationMeasurement,
  type ObservationTriageLevel,
} from "../schemas/observation-terminology";
import { ObservationCreateSchema } from "../schemas/observation";
import type { Reference } from "../schemas/common";
import type { ObservationCreateInput } from "../schemas/observation";

export interface ClinicalObservationContext {
  /** Patient/{ihs-number} */
  subject: Reference;
  /** Encounter/{id} */
  encounter: Reference;
  /** Practitioner(s) who performed the examination (mandatory in SATUSEHAT) */
  performer: Reference | [Reference, ...Reference[]];
  /** When the examination was done */
  effectiveDateTime: string;
  /** When the result was recorded; defaults to effectiveDateTime */
  issued?: string;
}

interface Coding {
  system: string;
  code: string;
  display: string;
}

function buildObservation(
  context: ClinicalObservationContext,
  category: ObservationCategoryCode,
  code: Coding,
  value: Partial<ObservationCreateInput>,
): ObservationCreateInput {
  const { system, display } = OBSERVATION_CATEGORIES[category];

  return ObservationCreateSchema.parse({
    resourceType: "Observation",
    status: "final",
    category: [{ coding: [{ system, code: category, display }] }],
    code: { coding: [code] },
    subject: context.subject,
    encounter: context.encounter,
    effectiveDateTime: context.effectiveDateTime,
    issued: context.issued ?? context.effectiveDateTime,
    performer: Array.isArray(context.performer) ? context.performer : [context.performer],
    ...value,
  });
}

/**
 * Pemeriksaan Fisik (Rawat Jalan, Rawat Inap, and Asesmen Awal IGD): tanda vital, antropometri,
 * tingkat kesadaran, and head-to-toe findings. One Observation per item, as in the SATUSEHAT
 * guides. Send each result with client.observation.create.
 */
export class PhysicalExamBuilder {
  public constructor(private readonly context: ClinicalObservationContext) {}

  /** Tanda vital or antropometri (category vital-signs, valueQuantity). */
  public buildMeasurement(
    measurement: ObservationMeasurement,
    value: number,
  ): ObservationCreateInput {
    if (!Number.isFinite(value)) {
      throw new RangeError(`Observation value for "${measurement}" must be a finite number`);
    }

    const definition = OBSERVATION_MEASUREMENTS[measurement];

    return buildObservation(
      this.context,
      "vital-signs",
      { system: LOINC_SYSTEM, code: definition.code, display: definition.display },
      {
        valueQuantity: {
          value,
          unit: definition.unit,
          system: UCUM_SYSTEM,
          code: definition.ucum,
        },
      },
    );
  }

  /** Every measured item, skipping the ones without a value. */
  public buildMeasurements(values: {
    [Measurement in ObservationMeasurement]?: number | undefined;
  }): ObservationCreateInput[] {
    return (Object.keys(OBSERVATION_MEASUREMENTS) as ObservationMeasurement[])
      .filter((measurement) => values[measurement] !== undefined)
      .map((measurement) => this.buildMeasurement(measurement, values[measurement]!));
  }

  /** Tingkat kesadaran (category exam, LOINC 67775-7, SNOMED CT value). */
  public buildConsciousness(level: ObservationConsciousnessLevel): ObservationCreateInput {
    const { system, display } = OBSERVATION_CONSCIOUSNESS_LEVELS[level];

    return buildObservation(
      this.context,
      "exam",
      { system: LOINC_SYSTEM, ...OBSERVATION_CONSCIOUSNESS_CODE },
      { valueCodeableConcept: { coding: [{ system, code: level, display }] } },
    );
  }

  /** Pemeriksaan fisik head to toe (category exam, LOINC narrative, valueString). */
  public buildHeadToToe(site: ObservationHeadToToeSite, finding: string): ObservationCreateInput {
    if (!finding.trim()) {
      throw new RangeError(`Head-to-toe finding for "${site}" must not be empty`);
    }

    const definition: ObservationHeadToToeDefinition = OBSERVATION_HEAD_TO_TOE_EXAMS[site];

    return buildObservation(
      this.context,
      "exam",
      { system: LOINC_SYSTEM, code: definition.code, display: definition.display },
      {
        valueString: finding,
        ...(definition.bodySite
          ? { bodySite: { coding: [{ system: SNOMED_CT_SYSTEM, ...definition.bodySite }] } }
          : {}),
      },
    );
  }

  /** Every examined body site, skipping empty findings. */
  public buildHeadToToeExams(findings: {
    [Site in ObservationHeadToToeSite]?: string | undefined;
  }): ObservationCreateInput[] {
    return (Object.keys(OBSERVATION_HEAD_TO_TOE_EXAMS) as ObservationHeadToToeSite[])
      .filter((site) => findings[site]?.trim())
      .map((site) => this.buildHeadToToe(site, findings[site]!));
  }
}

/**
 * Pengiriman Data Triase dan Gawat Darurat (IGD): sarana transportasi kedatangan, surat pengantar
 * rujukan, and kondisi pasien tiba (CTAS). Category survey.
 */
export class EmergencyTriageBuilder {
  public constructor(private readonly context: ClinicalObservationContext) {}

  /** Sarana transportasi kedatangan. Use `otherText` with "lain-lain". */
  public buildArrivalTransport(
    mode: ObservationArrivalTransportMode,
    otherText?: string,
  ): ObservationCreateInput {
    return buildObservation(
      this.context,
      "survey",
      { system: LOINC_SYSTEM, ...OBSERVATION_ARRIVAL_TRANSPORT_CODE },
      {
        valueCodeableConcept: {
          coding: [{ ...OBSERVATION_ARRIVAL_TRANSPORT_MODES[mode] }],
          ...(otherText ? { text: otherText } : {}),
        },
      },
    );
  }

  /** Surat pengantar rujukan: whether the patient brought a referral letter. */
  public buildReferralLetter(hasReferralLetter: boolean): ObservationCreateInput {
    return buildObservation(
      this.context,
      "survey",
      { ...OBSERVATION_REFERRAL_LETTER_CODE },
      { valueBoolean: hasReferralLetter },
    );
  }

  /** Kondisi pasien tiba (Canadian Triage and Acuity Scale). */
  public buildTriageLevel(level: ObservationTriageLevel): ObservationCreateInput {
    return buildObservation(
      this.context,
      "survey",
      { system: LOINC_SYSTEM, ...OBSERVATION_TRIAGE_CODE },
      { valueCodeableConcept: { coding: [{ ...OBSERVATION_TRIAGE_LEVELS[level] }] } },
    );
  }
}

export function createPhysicalExamBuilder(
  context: ClinicalObservationContext,
): PhysicalExamBuilder {
  return new PhysicalExamBuilder(context);
}

export function createEmergencyTriageBuilder(
  context: ClinicalObservationContext,
): EmergencyTriageBuilder {
  return new EmergencyTriageBuilder(context);
}

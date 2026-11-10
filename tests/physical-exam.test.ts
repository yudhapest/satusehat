import { describe, test } from "node:test";

import {
  createEmergencyTriageBuilder,
  createPhysicalExamBuilder,
  createSatuSehatClient,
  OBSERVATION_ARRIVAL_TRANSPORT_MODES,
  OBSERVATION_CONSCIOUSNESS_LEVELS,
  OBSERVATION_HEAD_TO_TOE_EXAMS,
  OBSERVATION_MEASUREMENTS,
  OBSERVATION_TRIAGE_LEVELS,
  SatuSehatValidationError,
  type ObservationArrivalTransportMode,
  type ObservationConsciousnessLevel,
  type ObservationHeadToToeSite,
  type ObservationMeasurement,
  type ObservationTriageLevel,
} from "../src";
import {
  ObservationCreateSchema,
  ObservationSchema,
  ObservationSubmitSchema,
} from "../src/schemas/observation";
import { expect } from "./helpers/expect";

const context = {
  subject: { reference: "Patient/P02478375538" },
  encounter: { reference: "Encounter/2b2d0a3e-082a-4fe9-ae13-da9c3b5e422f" },
  performer: { reference: "Practitioner/N10000001" },
  effectiveDateTime: "2026-11-10T01:00:00+00:00",
};

const keys = <TKey extends string>(table: Record<TKey, unknown>) => Object.keys(table) as TKey[];

describe("pemeriksaan fisik: tanda vital dan antropometri", () => {
  test("builds heart rate exactly as the SATUSEHAT mapping", () => {
    expect(createPhysicalExamBuilder(context).buildMeasurement("denyut-jantung", 80)).toEqual({
      resourceType: "Observation",
      status: "final",
      category: [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/observation-category",
              code: "vital-signs",
              display: "Vital Signs",
            },
          ],
        },
      ],
      code: { coding: [{ system: "http://loinc.org", code: "8867-4", display: "Heart rate" }] },
      subject: context.subject,
      encounter: context.encounter,
      effectiveDateTime: context.effectiveDateTime,
      issued: context.effectiveDateTime,
      performer: [context.performer],
      valueQuantity: {
        value: 80,
        unit: "beats/min",
        system: "http://unitsofmeasure.org",
        code: "/min",
      },
    });
  });

  test("uses the guide units for blood pressure and temperature", () => {
    const builder = createPhysicalExamBuilder(context);

    expect(builder.buildMeasurement("sistole", 120).valueQuantity).toEqual({
      value: 120,
      unit: "mm[Hg]",
      system: "http://unitsofmeasure.org",
      code: "mm[Hg]",
    });
    expect(builder.buildMeasurement("diastole", 80).code.coding[0]?.code).toBe("8462-4");
    expect(builder.buildMeasurement("suhu-tubuh", 36.8).valueQuantity).toEqual({
      value: 36.8,
      unit: "C",
      system: "http://unitsofmeasure.org",
      code: "Cel",
    });
  });

  test("builds every measured item and skips missing ones", () => {
    const observations = createPhysicalExamBuilder(context).buildMeasurements({
      "denyut-jantung": 80,
      pernapasan: 20,
      sistole: 120,
      diastole: 80,
      "suhu-tubuh": 36.8,
      "tinggi-badan": 170,
      "berat-badan": 65,
      "luas-permukaan-tubuh": undefined,
    });

    expect(observations.map((observation) => observation.code.coding[0]?.code)).toEqual([
      "8867-4",
      "9279-1",
      "8480-6",
      "8462-4",
      "8310-5",
      "8302-2",
      "29463-7",
    ]);
  });

  test("rejects non-numeric values", () => {
    expect(() =>
      createPhysicalExamBuilder(context).buildMeasurement("denyut-jantung", Number.NaN),
    ).toThrow("must be a finite number");
  });
});

describe("pemeriksaan fisik: tingkat kesadaran dan head to toe", () => {
  test("builds tingkat kesadaran with LOINC 67775-7 and a SNOMED CT value", () => {
    const observation = createPhysicalExamBuilder(context).buildConsciousness("248234008");

    expect(observation.category?.[0]?.coding?.[0]?.code).toBe("exam");
    expect(observation.code.coding[0]).toEqual({
      system: "http://loinc.org",
      code: "67775-7",
      display: "Level of responsiveness",
    });
    expect(observation.valueCodeableConcept?.coding?.[0]).toEqual({
      system: "http://snomed.info/sct",
      code: "248234008",
      display: "Mentally alert",
    });
  });

  test("builds head-to-toe findings as narrative strings with body sites where defined", () => {
    const builder = createPhysicalExamBuilder(context);
    const kepala = builder.buildHeadToToe("kepala", "Normocephal, tidak ada lesi");
    const tonsil = builder.buildHeadToToe("tonsil", "T1-T1, tidak hiperemis");

    expect(kepala.code.coding[0]?.code).toBe("10199-8");
    expect(kepala.valueString).toBe("Normocephal, tidak ada lesi");
    expect(kepala.bodySite).toBeUndefined();
    expect(tonsil.code.coding[0]?.code).toBe("10201-2");
    expect(tonsil.bodySite?.coding?.[0]).toEqual({
      system: "http://snomed.info/sct",
      code: "91636008",
      display: "Bilateral palatine tonsils",
    });
  });

  test("skips empty findings and rejects an empty single finding", () => {
    const builder = createPhysicalExamBuilder(context);

    expect(
      builder.buildHeadToToeExams({ kepala: "Normal", mata: " ", leher: undefined }),
    ).toHaveLength(1);
    expect(() => builder.buildHeadToToe("mata", "  ")).toThrow("must not be empty");
  });
});

describe("IGD: triase dan gawat darurat", () => {
  test("builds sarana transportasi, surat rujukan, and CTAS with category survey", () => {
    const triage = createEmergencyTriageBuilder(context);
    const transport = triage.buildArrivalTransport("lain-lain", "Diantar ojek online");
    const referral = triage.buildReferralLetter(true);
    const level = triage.buildTriageLevel("emergensi");

    expect(transport.category?.[0]?.coding?.[0]?.code).toBe("survey");
    expect(transport.code.coding[0]?.code).toBe("74286-6");
    expect(transport.valueCodeableConcept).toEqual({
      coding: [{ system: "http://loinc.org", code: "LA46-8", display: "Other" }],
      text: "Diantar ojek online",
    });
    expect(referral.code.coding[0]).toEqual({
      system: "http://terminology.kemkes.go.id/CodeSystem/clinical-term",
      code: "OC000034",
      display: "Surat Pengantar Rujukan",
    });
    expect(referral.valueBoolean).toBe(true);
    expect(level.code.coding[0]?.code).toBe("75910-0");
    expect(level.valueCodeableConcept?.coding?.[0]).toEqual({
      system: "http://loinc.org",
      code: "LA6113-0",
      display: "2",
    });
  });
});

describe("observation terminology tables", () => {
  test("every official item builds a payload that can be submitted", () => {
    const exam = createPhysicalExamBuilder(context);
    const triage = createEmergencyTriageBuilder(context);
    const payloads = [
      ...keys(OBSERVATION_MEASUREMENTS).map((key: ObservationMeasurement) =>
        exam.buildMeasurement(key, 1),
      ),
      ...keys(OBSERVATION_CONSCIOUSNESS_LEVELS).map((key: ObservationConsciousnessLevel) =>
        exam.buildConsciousness(key),
      ),
      ...keys(OBSERVATION_HEAD_TO_TOE_EXAMS).map((key: ObservationHeadToToeSite) =>
        exam.buildHeadToToe(key, "Normal"),
      ),
      ...keys(OBSERVATION_ARRIVAL_TRANSPORT_MODES).map((key: ObservationArrivalTransportMode) =>
        triage.buildArrivalTransport(key),
      ),
      ...keys(OBSERVATION_TRIAGE_LEVELS).map((key: ObservationTriageLevel) =>
        triage.buildTriageLevel(key),
      ),
    ];

    expect(payloads).toHaveLength(8 + 6 + 28 + 4 + 6);
    for (const payload of payloads) {
      ObservationSubmitSchema.parse(payload);
    }
  });
});

describe("observation submission rules", () => {
  const withoutPerformer = {
    resourceType: "Observation" as const,
    status: "final" as const,
    code: { coding: [{ system: "http://loinc.org", code: "8867-4" }] },
    subject: context.subject,
    encounter: context.encounter,
    valueQuantity: { value: 80 },
  };

  test("drafts and stored observations may omit the performer", () => {
    expect(() => ObservationCreateSchema.parse(withoutPerformer)).not.toThrow();
    expect(() => ObservationSchema.parse({ ...withoutPerformer, id: "obs-1" })).not.toThrow();
  });

  test("client.observation.create rejects an observation without performer", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () => {
        throw new Error("Request must not be sent for an invalid payload");
      },
    });

    await expect(client.observation.create(withoutPerformer)).rejects.toBeInstanceOf(
      SatuSehatValidationError,
    );
  });

  test("keeps value types that were previously dropped", () => {
    const parsed = ObservationCreateSchema.parse({
      ...withoutPerformer,
      valueQuantity: undefined,
      valueDateTime: "2026-11-10T01:00:00+00:00",
      focus: [{ reference: "Condition/cond-1" }],
    });

    expect(parsed.valueDateTime).toBe("2026-11-10T01:00:00+00:00");
    expect(parsed.focus?.[0]?.reference).toBe("Condition/cond-1");
  });
});

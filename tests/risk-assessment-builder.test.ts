import { describe, test } from "node:test";

import { createRiskAssessmentBuilder } from "../src";
import { expect } from "./helpers/expect";

describe("risk assessment builder", () => {
  test("builds a risk assessment draft with predictions and supporting references", () => {
    const builder = createRiskAssessmentBuilder({
      subject: {
        reference: "Patient/100000030009",
        display: "Budi Santoso",
      },
      encounter: {
        reference: "Encounter/4f735a03-128b-464d-bf91-e6eacdf1c38f",
      },
      status: "final",
      code: {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: "225358003",
            display: "Risk for coronary heart disease",
          },
        ],
      },
      occurrenceDateTime: "2024-04-01T01:30:00+00:00",
    });

    const riskAssessment = builder
      .setCondition({
        reference: "Condition/2a4e1a13-ee52-4c8b-a2ef-f41c79de698d",
      })
      .setPerformer({
        reference: "Practitioner/N10000001",
        display: "Dokter Bronsig",
      })
      .addBasis({
        reference: "Observation/af8ac2e3-0e72-45d7-ab8a-332f52fccbcd",
      })
      .addPrediction({
        probabilityDecimal: 0.32,
        rationale: "Faktor risiko meningkat berdasarkan profil lipid dan riwayat keluarga.",
      })
      .setMitigation("Anjurkan modifikasi gaya hidup dan follow-up kardiologi.")
      .addNote({
        text: "Skoring risiko digunakan untuk evaluasi awal rawat jalan.",
      })
      .build();

    expect(riskAssessment.resourceType).toBe("RiskAssessment");
    expect(riskAssessment.subject.reference).toBe("Patient/100000030009");
    expect(riskAssessment.basis?.[0]?.reference).toBe(
      "Observation/af8ac2e3-0e72-45d7-ab8a-332f52fccbcd",
    );
    expect(riskAssessment.prediction?.[0]?.probabilityDecimal).toBe(0.32);
    expect(riskAssessment.mitigation).toBe("Anjurkan modifikasi gaya hidup dan follow-up kardiologi.");
  });

  test("switches between occurrenceDateTime and occurrencePeriod cleanly", () => {
    const riskAssessment = createRiskAssessmentBuilder({
      subject: {
        reference: "Patient/100000030009",
      },
      status: "preliminary",
    })
      .setOccurrenceDateTime("2024-04-01T01:30:00+00:00")
      .setOccurrencePeriod({
        start: "2024-04-01T01:30:00+00:00",
        end: "2024-04-30T01:30:00+00:00",
      })
      .build();

    expect(riskAssessment.occurrenceDateTime).toBeUndefined();
    expect(riskAssessment.occurrencePeriod?.start).toBe("2024-04-01T01:30:00+00:00");
    expect(riskAssessment.occurrencePeriod?.end).toBe("2024-04-30T01:30:00+00:00");
  });
});

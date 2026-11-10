import { describe, test } from "node:test";

import {
  createEmergencyEncounterHistory,
  createEncounterBuilder,
  createEncounterMedicationAdministrationBuilder,
} from "../src";
import type { EncounterCreateInput } from "../src";
import { createEncounterFixture } from "./fixtures/encounter";
import { expect } from "./helpers/expect";

function toBuilderInput(fixture: EncounterCreateInput) {
  return {
    identifier: fixture.identifier,
    status: fixture.status,
    statusHistory: fixture.statusHistory,
    classHistory: fixture.classHistory,
    ...(fixture.type ? { type: fixture.type } : {}),
    ...(fixture.serviceType ? { serviceType: fixture.serviceType } : {}),
    ...(fixture.priority ? { priority: fixture.priority } : {}),
    subject: fixture.subject,
    ...(fixture.episodeOfCare ? { episodeOfCare: fixture.episodeOfCare } : {}),
    ...(fixture.basedOn ? { basedOn: fixture.basedOn } : {}),
    ...(fixture.participant ? { participant: fixture.participant } : {}),
    period: fixture.period,
    ...(fixture.length ? { length: fixture.length } : {}),
    reasonCode: fixture.reasonCode,
    ...(fixture.reasonReference ? { reasonReference: fixture.reasonReference } : {}),
    diagnosis: fixture.diagnosis,
    ...(fixture.account ? { account: fixture.account } : {}),
    ...(fixture.hospitalization ? { hospitalization: fixture.hospitalization } : {}),
    location: fixture.location,
    serviceProvider: fixture.serviceProvider,
    ...(fixture.partOf ? { partOf: fixture.partOf } : {}),
  };
}

describe("encounter -> medication administration builder", () => {
  test("builds a post-encounter medication administration draft with shared subject and encounter", () => {
    const builder = createEncounterMedicationAdministrationBuilder({
      subject: {
        reference: "Patient/100000030009",
        display: "Budi Santoso",
      },
      encounter: {
        reference: "Encounter/enc-123",
      },
      medicationAdministration: {
        status: "completed",
        category: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/medication-admin-category",
              code: "inpatient",
              display: "Inpatient",
            },
          ],
        },
        medicationReference: {
          reference: "Medication/med-123",
          display: "Paracetamol 500 mg tablet",
        },
        effectiveDateTime: "2024-04-03T01:40:00+00:00",
      },
    })
      .addPerformer({
        actor: {
          reference: "Practitioner/N10000001",
          display: "Perawat Satu Sehat",
        },
      })
      .setDosage({
        text: "Berikan 1 tablet sesudah makan.",
        dose: {
          value: 1,
          unit: "TAB",
          system: "http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm",
          code: "TAB",
        },
      })
      .addNote({
        text: "Obat diberikan setelah pasien stabil di area observasi.",
      });

    const medicationAdministration = builder.buildMedicationAdministration();

    expect(medicationAdministration.resourceType).toBe("MedicationAdministration");
    expect(medicationAdministration.subject.reference).toBe("Patient/100000030009");
    expect(medicationAdministration.context?.reference).toBe("Encounter/enc-123");
    expect(medicationAdministration.medicationReference?.reference).toBe("Medication/med-123");
    expect(medicationAdministration.performer?.[0]?.actor.reference).toBe(
      "Practitioner/N10000001",
    );
    expect(medicationAdministration.note?.[0]?.text).toBe(
      "Obat diberikan setelah pasien stabil di area observasi.",
    );
  });

  test("keeps shared subject and encounter in sync and normalizes medication and effective choices", () => {
    const builder = createEncounterMedicationAdministrationBuilder({
      subject: {
        reference: "Patient/old",
      },
      encounter: {
        reference: "Encounter/old",
      },
      medicationAdministration: {
        status: "in-progress",
        medicationReference: {
          reference: "Medication/old",
        },
        effectiveDateTime: "2024-04-03T01:20:00+00:00",
      },
    })
      .setSubject({
        reference: "Patient/new",
      })
      .setEncounter({
        reference: "Encounter/new",
      })
      .setMedicationCodeableConcept({
        coding: [
          {
            system: "http://www.whocc.no/atc",
            code: "N02BE01",
            display: "Paracetamol",
          },
        ],
      })
      .setEffectivePeriod({
        start: "2024-04-03T01:20:00+00:00",
        end: "2024-04-03T01:35:00+00:00",
      })
      .mergeMedicationAdministration({
        category: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/medication-admin-category",
              code: "inpatient",
              display: "Inpatient",
            },
          ],
        },
      })
      .setStatus("completed");

    const medicationAdministration = builder.buildMedicationAdministration();

    expect(medicationAdministration.subject.reference).toBe("Patient/new");
    expect(medicationAdministration.context?.reference).toBe("Encounter/new");
    expect(medicationAdministration.medicationReference).toBeUndefined();
    expect(medicationAdministration.medicationCodeableConcept?.coding?.[0]?.code).toBe("N02BE01");
    expect(medicationAdministration.effectiveDateTime).toBeUndefined();
    expect(medicationAdministration.effectivePeriod?.end).toBe("2024-04-03T01:35:00+00:00");
    expect(medicationAdministration.status).toBe("completed");
  });

  test("reuses emergency encounter context for an IGD medication administration workflow", () => {
    const fixture = createEncounterFixture("emergency");
    const emergencyFlow = createEmergencyEncounterHistory({
      statusStages: [
        {
          status: "arrived",
          start: "2024-04-03T01:00:00+00:00",
        },
        {
          status: "triaged",
          start: "2024-04-03T01:05:00+00:00",
        },
        {
          status: "in-progress",
          start: "2024-04-03T01:15:00+00:00",
        },
      ],
      periodEnd: "2024-04-03T03:00:00+00:00",
    });

    const encounterDraft = createEncounterBuilder({
      ...emergencyFlow,
      ...toBuilderInput(fixture),
    }).build();

    const medicationAdministrationBuilder = createEncounterMedicationAdministrationBuilder({
      subject: encounterDraft.subject,
      encounter: {
        reference: "Encounter/enc-igd-1",
      },
      medicationAdministration: {
        status: "completed",
        medicationReference: {
          reference: "Medication/med-paracetamol",
          display: "Paracetamol 500 mg tablet",
        },
        effectiveDateTime: encounterDraft.period.end ?? "2024-04-03T03:00:00+00:00",
        reasonCode: encounterDraft.reasonCode,
      },
    })
      .setRequest({
        reference: "MedicationRequest/mr-igd-1",
      })
      .addPerformer({
        actor: encounterDraft.participant?.[1]?.individual ?? {
          reference: "Practitioner/N10000006",
        },
      })
      .addSupportingInformation({
        reference: "Condition/cond-igd-1",
      })
      .addNote({
        text: "Parasetamol oral diberikan setelah dokter IGD menyelesaikan asesmen awal.",
      });

    const medicationAdministration =
      medicationAdministrationBuilder.buildMedicationAdministration();

    expect(medicationAdministration.subject).toEqual(encounterDraft.subject);
    expect(medicationAdministration.context?.reference).toBe("Encounter/enc-igd-1");
    expect(medicationAdministration.request?.reference).toBe("MedicationRequest/mr-igd-1");
    expect(medicationAdministration.reasonCode?.[0]?.coding?.[0]?.code).toBe(
      encounterDraft.reasonCode?.[0]?.coding?.[0]?.code,
    );
    expect(medicationAdministration.performer?.[0]?.actor.reference).toBe(
      encounterDraft.participant?.[1]?.individual?.reference,
    );
    expect(medicationAdministration.supportingInformation?.[0]?.reference).toBe(
      "Condition/cond-igd-1",
    );
  });

  test("requires an effective choice before building a medication administration draft", () => {
    const builder = createEncounterMedicationAdministrationBuilder({
      subject: {
        reference: "Patient/100000030009",
      },
      encounter: {
        reference: "Encounter/enc-123",
      },
      medicationAdministration: {
        status: "completed",
        medicationReference: {
          reference: "Medication/med-123",
        },
        effectiveDateTime: "2024-04-03T01:40:00+00:00",
      },
    }).clearEffective();

    expect(() => builder.buildMedicationAdministration()).toThrow(
      "MedicationAdministration requires either effectiveDateTime or effectivePeriod",
    );
  });
});

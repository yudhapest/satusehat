import { describe, test } from "node:test";

import {
  createEmergencyEncounterHistory,
  createEncounterBuilder,
  createEncounterMedicationRequestBuilder,
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

describe("encounter -> medication request builder", () => {
  test("builds a post-encounter medication request draft with shared subject and encounter", () => {
    const builder = createEncounterMedicationRequestBuilder({
      subject: {
        reference: "Patient/100000030009",
        display: "Budi Santoso",
      },
      encounter: {
        reference: "Encounter/enc-123",
      },
      medicationRequest: {
        status: "active",
        intent: "order",
        medicationReference: {
          reference: "Medication/med-123",
          display: "Paracetamol 500 mg tablet",
        },
      },
    })
      .addCategory({
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/medicationrequest-category",
            code: "outpatient",
            display: "Outpatient",
          },
        ],
      })
      .setRequester({
        reference: "Practitioner/N10000001",
        display: "Dokter Jaga",
      })
      .addDosageInstruction({
        sequence: 1,
        text: "Minum 1 tablet 3 kali sehari sesudah makan",
      })
      .addNote({
        text: "Resep awal diberikan setelah asesmen IGD selesai.",
      });

    const medicationRequest = builder.buildMedicationRequest();

    expect(medicationRequest.resourceType).toBe("MedicationRequest");
    expect(medicationRequest.subject.reference).toBe("Patient/100000030009");
    expect(medicationRequest.encounter?.reference).toBe("Encounter/enc-123");
    expect(medicationRequest.medicationReference.reference).toBe("Medication/med-123");
    expect(medicationRequest.requester?.reference).toBe("Practitioner/N10000001");
    expect(medicationRequest.note?.[0]?.text).toBe(
      "Resep awal diberikan setelah asesmen IGD selesai.",
    );
  });

  test("keeps shared subject and encounter in sync while normalizing the medication request draft", () => {
    const builder = createEncounterMedicationRequestBuilder({
      subject: {
        reference: "Patient/old",
      },
      encounter: {
        reference: "Encounter/old",
      },
      medicationRequest: {
        status: "draft",
        intent: "proposal",
        medicationReference: {
          reference: "Medication/old",
        },
      },
    })
      .setSubject({
        reference: "Patient/new",
      })
      .setEncounter({
        reference: "Encounter/new",
      })
      .setMedicationReference({
        reference: "Medication/new",
        display: "Amoxicillin 500 mg capsule",
      })
      .setIntent("order")
      .setStatus("active")
      .setPriority("urgent")
      .setReportedBoolean(false)
      .mergeMedicationRequest({
        authoredOn: "2024-04-03T02:00:00+00:00",
      });

    const medicationRequest = builder.buildMedicationRequest();

    expect(medicationRequest.subject.reference).toBe("Patient/new");
    expect(medicationRequest.encounter?.reference).toBe("Encounter/new");
    expect(medicationRequest.medicationReference.reference).toBe("Medication/new");
    expect(medicationRequest.intent).toBe("order");
    expect(medicationRequest.status).toBe("active");
    expect(medicationRequest.priority).toBe("urgent");
    expect(medicationRequest.reportedBoolean).toBe(false);
    expect(medicationRequest.authoredOn).toBe("2024-04-03T02:00:00+00:00");
  });

  test("reuses emergency encounter context for an IGD prescribing workflow", () => {
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

    const medicationRequestBuilder = createEncounterMedicationRequestBuilder({
      subject: encounterDraft.subject,
      encounter: {
        reference: "Encounter/enc-igd-1",
      },
      medicationRequest: {
        status: "active",
        intent: "order",
        medicationReference: {
          reference: "Medication/med-amoxicillin",
          display: "Amoxicillin 500 mg capsule",
        },
        authoredOn: encounterDraft.period.end ?? "2024-04-03T03:00:00+00:00",
        reasonCode: encounterDraft.reasonCode,
      },
    })
      .addBasedOn({
        reference: "ServiceRequest/sr-igd-1",
      })
      .setRequester(
        encounterDraft.participant?.[0]?.individual ?? {
          reference: "Practitioner/N10000001",
        },
      )
      .setPerformer({
        reference: "PractitionerRole/pr-igd-pharmacy",
      })
      .setPerformerType({
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/medication-intended-performer-role",
            code: "pharmacist",
            display: "Pharmacist",
          },
        ],
      })
      .addReasonReference({
        reference: "Condition/cond-igd-1",
      })
      .addInsurance({
        reference: "Coverage/cov-bpjs-1",
      })
      .setDispenseRequest({
        quantity: {
          value: 12,
          unit: "CAP",
          system: "http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm",
          code: "CAP",
        },
        expectedSupplyDuration: {
          value: 4,
          unit: "days",
          system: "http://unitsofmeasure.org",
          code: "d",
        },
      })
      .setSubstitution({
        allowedBoolean: false,
      })
      .addNote({
        text: "Antibiotik oral dimulai setelah pasien diputuskan pulang dari observasi IGD.",
      });

    const medicationRequest = medicationRequestBuilder.buildMedicationRequest();

    expect(medicationRequest.subject).toEqual(encounterDraft.subject);
    expect(medicationRequest.encounter?.reference).toBe("Encounter/enc-igd-1");
    expect(medicationRequest.basedOn?.[0]?.reference).toBe("ServiceRequest/sr-igd-1");
    expect(medicationRequest.reasonCode?.[0]?.coding?.[0]?.code).toBe(
      encounterDraft.reasonCode?.[0]?.coding?.[0]?.code,
    );
    expect(medicationRequest.requester?.reference).toBe(
      encounterDraft.participant?.[0]?.individual?.reference,
    );
    expect(medicationRequest.reasonReference?.[0]?.reference).toBe("Condition/cond-igd-1");
    expect(medicationRequest.insurance?.[0]?.reference).toBe("Coverage/cov-bpjs-1");
    expect(medicationRequest.substitution?.allowedBoolean).toBe(false);
  });

  test("rejects invalid required fields when merging the medication request draft", () => {
    const builder = createEncounterMedicationRequestBuilder({
      subject: {
        reference: "Patient/100000030009",
      },
      encounter: {
        reference: "Encounter/enc-123",
      },
      medicationRequest: {
        status: "active",
        intent: "order",
        medicationReference: {
          reference: "Medication/med-123",
        },
      },
    }).setMedicationReference({
      reference: "",
    });

    expect(() => builder.buildMedicationRequest()).toThrow();
  });
});

import { describe, test } from "node:test";

import {
  createEncounterDiagnosis,
  createEmergencyEncounterHistory,
  createEncounterBuilder,
  createEncounterConditionBuilder,
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

describe("encounter -> condition builder", () => {
  test("creates encounter diagnosis directly from condition id without condition builder", () => {
    const diagnosis = createEncounterDiagnosis({
      conditionId: "cond-direct-1",
    });

    expect(diagnosis.condition.reference).toBe("Condition/cond-direct-1");
    expect(diagnosis.use.coding[0]?.code).toBe("AD");
    expect(diagnosis.rank).toBe(1);
  });

  test("uses the HL7 diagnosis-role code system accepted by SATUSEHAT by default", () => {
    // SATUSEHAT rejects https://www.hl7.org/fhir/Codesystem-diagnosis-role (RuleNumber 10317).
    const diagnosis = createEncounterDiagnosis({
      conditionId: "cond-direct-1",
    });

    expect(diagnosis.use.coding[0]?.system).toBe(
      "http://terminology.hl7.org/CodeSystem/diagnosis-role",
    );
  });

  test("builds a post-encounter condition draft with default encounter diagnosis category", () => {
    const builder = createEncounterConditionBuilder({
      subject: {
        reference: "Patient/100000030009",
        display: "Budi Santoso",
      },
      encounter: {
        reference: "Encounter/enc-123",
      },
      condition: {
        code: {
          coding: [
            {
              system: "http://hl7.org/fhir/sid/icd-10",
              code: "R07.4",
              display: "Chest pain, unspecified",
            },
          ],
        },
        clinicalStatus: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
              code: "active",
              display: "Active",
            },
          ],
        },
      },
    }).addNote({
      text: "Diagnosis kerja awal di IGD.",
    });

    const condition = builder.buildCondition();

    expect(condition.resourceType).toBe("Condition");
    expect(condition.subject.reference).toBe("Patient/100000030009");
    expect(condition.encounter.reference).toBe("Encounter/enc-123");
    expect(condition.category?.[0]?.coding?.[0]?.code).toBe("encounter-diagnosis");
    expect(condition.note?.[0]?.text).toBe("Diagnosis kerja awal di IGD.");
  });

  test("keeps shared subject and encounter in sync and builds diagnosis link after condition creation", () => {
    const builder = createEncounterConditionBuilder({
      subject: {
        reference: "Patient/old",
      },
      encounter: {
        reference: "Encounter/old",
      },
      condition: {
        code: {
          coding: [
            {
              system: "http://hl7.org/fhir/sid/icd-10",
              code: "I10",
              display: "Essential (primary) hypertension",
            },
          ],
        },
      },
    })
      .setSubject({
        reference: "Patient/new",
      })
      .setEncounter({
        reference: "Encounter/new",
      })
      .mergeCondition({
        verificationStatus: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
              code: "provisional",
              display: "Provisional",
            },
          ],
        },
      });

    const condition = builder.buildCondition();
    const diagnosis = builder.buildEncounterDiagnosis({
      conditionId: "cond-1",
    });

    expect(condition.subject.reference).toBe("Patient/new");
    expect(condition.encounter.reference).toBe("Encounter/new");
    expect(condition.verificationStatus?.coding?.[0]?.code).toBe("provisional");
    expect(diagnosis.condition.reference).toBe("Condition/cond-1");
    expect(diagnosis.use.coding[0]?.code).toBe("AD");
    expect(diagnosis.rank).toBe(1);
  });

  test("reuses encounter context from an IGD flow and allows explicit diagnosis references", () => {
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

    const conditionBuilder = createEncounterConditionBuilder({
      subject: encounterDraft.subject,
      encounter: {
        reference: "Encounter/enc-igd-1",
      },
      condition: {
        code: {
          coding: [
            {
              system: "http://hl7.org/fhir/sid/icd-10",
              code: "J18.9",
              display: "Pneumonia, unspecified organism",
            },
          ],
        },
        recorder: fixture.participant?.[0]?.individual,
      },
    });

    const condition = conditionBuilder.buildCondition();
    const diagnosis = conditionBuilder.buildEncounterDiagnosis({
      conditionReference: {
        reference: "Condition/cond-explicit",
        display: "Pneumonia suspek",
      },
      use: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/diagnosis-role",
            code: "DD",
            display: "Discharge diagnosis",
          },
        ],
      },
      rank: 2,
    });

    expect(condition.subject).toEqual(encounterDraft.subject);
    expect(condition.encounter.reference).toBe("Encounter/enc-igd-1");
    expect(condition.recorder?.reference).toBe(fixture.participant?.[0]?.individual?.reference);
    expect(diagnosis.condition.reference).toBe("Condition/cond-explicit");
    expect(diagnosis.condition.display).toBe("Pneumonia suspek");
    expect(diagnosis.use.coding[0]?.code).toBe("DD");
    expect(diagnosis.rank).toBe(2);
  });

  test("requires a created condition reference before building encounter diagnosis", () => {
    const builder = createEncounterConditionBuilder({
      subject: {
        reference: "Patient/100000030009",
      },
      encounter: {
        reference: "Encounter/enc-123",
      },
      condition: {
        code: {
          coding: [
            {
              system: "http://hl7.org/fhir/sid/icd-10",
              code: "R50.9",
              display: "Fever, unspecified",
            },
          ],
        },
      },
    });

    expect(() => builder.buildEncounterDiagnosis()).toThrow(
      "Condition link is required. Provide conditionId or conditionReference before building Encounter diagnosis.",
    );
  });
});

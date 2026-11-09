import { describe, test } from "node:test";

import {
  createEmergencyEncounterHistory,
  createEncounterBuilder,
  createEncounterProcedureBuilder,
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

describe("encounter -> procedure builder", () => {
  test("builds a post-encounter procedure draft with shared subject and encounter", () => {
    const builder = createEncounterProcedureBuilder({
      subject: {
        reference: "Patient/100000030009",
        display: "Budi Santoso",
      },
      encounter: {
        reference: "Encounter/enc-123",
      },
      procedure: {
        status: "completed",
        category: {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "103693007",
              display: "Diagnostic procedure",
            },
          ],
        },
        code: {
          coding: [
            {
              system: "http://hl7.org/fhir/sid/icd-9-cm",
              code: "88.72",
              display: "Diagnostic ultrasound of heart",
            },
          ],
        },
        performedDateTime: "2024-04-03T01:35:00+00:00",
      },
    })
      .addPerformer({
        actor: {
          reference: "Practitioner/N10000006",
          display: "dr. Andi",
        },
      })
      .addReasonCode({
        coding: [
          {
            system: "http://hl7.org/fhir/sid/icd-10",
            code: "R07.4",
            display: "Chest pain, unspecified",
          },
        ],
      })
      .addNote({
        text: "USG bedside dilakukan setelah evaluasi awal IGD.",
      });

    const procedure = builder.buildProcedure();

    expect(procedure.resourceType).toBe("Procedure");
    expect(procedure.subject.reference).toBe("Patient/100000030009");
    expect(procedure.encounter.reference).toBe("Encounter/enc-123");
    expect(procedure.performer?.[0]?.actor.reference).toBe("Practitioner/N10000006");
    expect(procedure.reasonCode?.[0]?.coding?.[0]?.code).toBe("R07.4");
    expect(procedure.note?.[0]?.text).toBe(
      "USG bedside dilakukan setelah evaluasi awal IGD.",
    );
  });

  test("keeps shared subject and encounter in sync and normalizes performed choice", () => {
    const builder = createEncounterProcedureBuilder({
      subject: {
        reference: "Patient/old",
      },
      encounter: {
        reference: "Encounter/old",
      },
      procedure: {
        status: "in-progress",
        code: {
          coding: [
            {
              system: "http://hl7.org/fhir/sid/icd-9-cm",
              code: "89.52",
              display: "Electrocardiogram",
            },
          ],
        },
        performedDateTime: "2024-04-03T01:20:00+00:00",
      },
    })
      .setSubject({
        reference: "Patient/new",
      })
      .setEncounter({
        reference: "Encounter/new",
      })
      .setPerformedPeriod({
        start: "2024-04-03T01:20:00+00:00",
        end: "2024-04-03T01:35:00+00:00",
      })
      .mergeProcedure({
        status: "completed",
      })
      .setOutcome({
        coding: [
          {
            system: "http://snomed.info/sct",
            code: "385669000",
            display: "Successful",
          },
        ],
      });

    const procedure = builder.buildProcedure();

    expect(procedure.subject.reference).toBe("Patient/new");
    expect(procedure.encounter.reference).toBe("Encounter/new");
    expect(procedure.performedDateTime).toBeUndefined();
    expect(procedure.performedPeriod?.start).toBe("2024-04-03T01:20:00+00:00");
    expect(procedure.performedPeriod?.end).toBe("2024-04-03T01:35:00+00:00");
    expect(procedure.outcome?.coding?.[0]?.code).toBe("385669000");
  });

  test("reuses emergency encounter context for IGD procedure workflow", () => {
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

    const procedureBuilder = createEncounterProcedureBuilder({
      subject: encounterDraft.subject,
      encounter: {
        reference: "Encounter/enc-igd-1",
      },
      procedure: {
        status: "completed",
        category: {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "103693007",
              display: "Diagnostic procedure",
            },
          ],
        },
        code: {
          coding: [
            {
              system: "http://hl7.org/fhir/sid/icd-9-cm",
              code: "89.52",
              display: "Electrocardiogram",
            },
          ],
        },
        reasonCode: encounterDraft.reasonCode,
        performer: [
          {
            actor: encounterDraft.participant?.[1]?.individual ?? {
              reference: "Practitioner/N10000006",
            },
          },
        ],
        location: encounterDraft.location[1]?.location,
        performedDateTime: encounterDraft.period.end,
      },
    })
      .addBodySite({
        coding: [
          {
            system: "http://snomed.info/sct",
            code: "51185008",
            display: "Thorax structure",
          },
        ],
      })
      .addUsedCode({
        coding: [
          {
            system: "http://snomed.info/sct",
            code: "86184003",
            display: "Electrode",
          },
        ],
      })
      .addNote({
        text: "EKG 12 sadapan dilakukan setelah pasien dipindahkan ke area observasi IGD.",
      });

    const procedure = procedureBuilder.buildProcedure();

    expect(procedure.subject).toEqual(encounterDraft.subject);
    expect(procedure.encounter.reference).toBe("Encounter/enc-igd-1");
    expect(procedure.reasonCode?.[0]?.coding?.[0]?.code).toBe(
      encounterDraft.reasonCode?.[0]?.coding?.[0]?.code,
    );
    expect(procedure.performer?.[0]?.actor.reference).toBe(
      encounterDraft.participant?.[1]?.individual?.reference,
    );
    expect(procedure.location?.reference).toBe(encounterDraft.location[1]?.location.reference);
    expect(procedure.usedCode?.[0]?.coding?.[0]?.code).toBe("86184003");
  });
});

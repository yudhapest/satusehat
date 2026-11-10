import { describe, test } from "node:test";

import { createEncounterQueueBuilder } from "../src";
import { expect } from "./helpers/expect";

describe("encounter queue builder", () => {
  test("builds rawat jalan antrean drafts per stage and finishes with diagnosis linkage", () => {
    const builder = createEncounterQueueBuilder({
      organizationId: "100025939",
      registrationId: "ANTRI-88537",
      subject: {
        reference: "Patient/P02361976250",
        display: "LINA,NY",
      },
      consultationMethod: "RAJAL",
      serviceProviderDisplay: "RS SATUSEHAT",
      statusTimeline: {
        stages: [
          {
            status: "arrived",
            start: "2026-04-06T14:01:52+07:00",
          },
          {
            status: "in-progress",
            start: "2026-04-06T14:10:00+07:00",
          },
          {
            status: "finished",
            start: "2026-04-06T14:31:52+07:00",
          },
        ],
        periodEnd: "2026-04-06T14:31:52+07:00",
      },
      location: {
        locationId: "2148a1a7-925d-4543-ac63-2e9bf53e5c68",
        display: "FISIO TERAPI",
        status: "active",
      },
      participants: {
        practitionerId: "10006330933",
        display: "dr. Asih Aprilya, Sp. KFR, M.Ked.Klin",
        typeText: "Dokter penanggung jawab pelayanan",
      },
      encounter: {
        reasonCode: [
          {
            coding: [
              {
                system: "http://snomed.info/sct",
                code: "185349003",
                display: "Encounter for check up",
              },
            ],
            text: "PRIMARY GONARTHROSIS. BILATERAL",
          },
        ],
      },
      condition: {
        code: {
          coding: [
            {
              system: "http://hl7.org/fhir/sid/icd-10",
              code: "M17.0",
              display: "PRIMARY GONARTHROSIS. BILATERAL",
            },
          ],
          text: "PRIMARY GONARTHROSIS. BILATERAL",
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
    });

    const arrivedEncounter = builder.buildEncounterAtStage("arrived");
    const inProgressEncounter = builder.buildEncounterAtStage("in-progress");
    const finishedEncounter = builder.buildEncounter();
    const condition = builder.buildCondition("enc-123", "Kunjungan LINA,NY pada 2026-04-06");
    const finalEncounter = builder.buildEncounterWithDiagnosis({
      conditionId: "cond-456",
    });

    expect(builder.listEncounterStages()).toEqual(["arrived", "in-progress", "finished"]);

    expect(arrivedEncounter.status).toBe("arrived");
    expect(arrivedEncounter.statusHistory).toHaveLength(1);
    expect(arrivedEncounter.period).toEqual({
      start: "2026-04-06T14:01:52+07:00",
      end: "2026-04-06T14:10:00+07:00",
    });

    expect(inProgressEncounter.status).toBe("in-progress");
    expect(inProgressEncounter.statusHistory).toHaveLength(2);
    expect(inProgressEncounter.class.code).toBe("AMB");
    expect(inProgressEncounter.identifier[0]?.value).toBe("ANTRI-88537");

    expect(finishedEncounter.status).toBe("finished");
    expect(finishedEncounter.diagnosis).toBeUndefined();
    expect(finishedEncounter.serviceProvider.reference).toBe("Organization/100025939");

    expect(condition.subject.reference).toBe("Patient/P02361976250");
    expect(condition.encounter.reference).toBe("Encounter/enc-123");
    expect(condition.category?.[0]?.coding?.[0]?.code).toBe("encounter-diagnosis");

    expect(finalEncounter.status).toBe("finished");
    expect(finalEncounter.diagnosis?.[0]?.condition.reference).toBe("Condition/cond-456");
    expect(finalEncounter.participant?.[0]?.individual?.reference).toBe(
      "Practitioner/10006330933",
    );
  });

  test("requires configured condition and known stage when building queue workflow outputs", () => {
    const builder = createEncounterQueueBuilder({
      organizationId: "100025939",
      registrationId: "ANTRI-88538",
      subject: {
        reference: "Patient/P02361976251",
      },
      statusTimeline: {
        stages: [
          {
            status: "arrived",
            start: "2026-04-06T14:01:52+07:00",
          },
        ],
        periodEnd: "2026-04-06T14:01:52+07:00",
      },
      location: {
        locationId: "2148a1a7-925d-4543-ac63-2e9bf53e5c68",
      },
    });

    expect(() => builder.buildEncounterAtStage("finished")).toThrow(
      'Encounter status "finished" was not found in the configured timeline.',
    );
    expect(() => builder.buildCondition("enc-124")).toThrow(
      "Condition input is not configured. Provide condition in createEncounterQueueBuilder(...) before building Condition.",
    );
  });
});

import { describe, test } from "node:test";

import {
  createEncounterClassFromConsultationMethod,
  createEmergencyEncounterHistory,
  createEncounterBuilder,
  createEncounterHospitalization,
  createEncounterIdentifier,
  createEncounterLocation,
  createEncounterLocationServiceClassExtension,
  createEncounterParticipant,
  createEncounterServiceProviderReference,
  createEncounterStatusTimeline,
  withEncounterLocationServiceClass,
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

describe("encounter builder", () => {
  test("provides antrean-friendly helper values for identifier, participant, location, service provider, and status timeline", () => {
    const identifier = createEncounterIdentifier("100025939", "ANTRI-88537");
    const serviceProvider = createEncounterServiceProviderReference(
      "100025939",
      "RS SATUSEHAT",
    );
    const participant = createEncounterParticipant({
      practitionerId: "10006330933",
      display: "dr. Asih Aprilya, Sp. KFR, M.Ked.Klin",
    });
    const location = createEncounterLocation({
      locationId: "2148a1a7-925d-4543-ac63-2e9bf53e5c68",
      display: "FISIO TERAPI",
      status: "active",
    });
    const timeline = createEncounterStatusTimeline({
      stages: [
        {
          status: "arrived",
          start: "2026-04-06T14:01:52.000+00:00",
        },
        {
          status: "in-progress",
          start: "2026-04-06T14:10:00.000+00:00",
        },
        {
          status: "finished",
          start: "2026-04-06T14:31:52.000+00:00",
        },
      ],
      periodEnd: "2026-04-06T14:31:52.000+00:00",
    });

    expect(identifier.system).toBe("http://sys-ids.kemkes.go.id/encounter/100025939");
    expect(identifier.use).toBe("official");
    expect(serviceProvider.reference).toBe("Organization/100025939");
    expect(participant.type?.[0]?.coding?.[0]?.code).toBe("ATND");
    expect(participant.individual?.reference).toBe("Practitioner/10006330933");
    expect(location.location.reference).toBe("Location/2148a1a7-925d-4543-ac63-2e9bf53e5c68");
    expect(timeline.status).toBe("finished");
    expect(timeline.statusHistory).toEqual([
      {
        status: "arrived",
        period: {
          start: "2026-04-06T14:01:52.000+00:00",
          end: "2026-04-06T14:10:00.000+00:00",
        },
      },
      {
        status: "in-progress",
        period: {
          start: "2026-04-06T14:10:00.000+00:00",
          end: "2026-04-06T14:31:52.000+00:00",
        },
      },
      {
        status: "finished",
        period: {
          start: "2026-04-06T14:31:52.000+00:00",
          end: "2026-04-06T14:31:52.000+00:00",
        },
      },
    ]);
  });

  test("supports consultation method and diagnosis-by-condition shortcuts inspired by legacy controllers", () => {
    const fixture = createEncounterFixture("outpatient");

    const encounter = createEncounterBuilder({
      preset: "outpatient",
      ...toBuilderInput(fixture),
      diagnosis: undefined,
    })
      .setConsultationMethod("IGD")
      .addDiagnosisByCondition("cond-final-1", {
        display: "Diagnosis final",
      })
      .build();

    expect(createEncounterClassFromConsultationMethod("RANAP").code).toBe("IMP");
    expect(createEncounterClassFromConsultationMethod("HOMECARE").code).toBe("HH");
    expect(encounter.class.code).toBe("EMER");
    expect(encounter.diagnosis?.[0]?.condition.reference).toBe("Condition/cond-final-1");
    expect(encounter.diagnosis?.[0]?.condition.display).toBe("Diagnosis final");
  });

  test("allows encounter draft creation without diagnosis for initial create flow", () => {
    const fixture = createEncounterFixture("emergency");
    const { diagnosis: _diagnosis, ...encounterWithoutDiagnosis } = toBuilderInput(fixture);

    const encounter = createEncounterBuilder({
      preset: "emergency",
      ...encounterWithoutDiagnosis,
    }).build();

    expect(encounter.resourceType).toBe("Encounter");
    expect(encounter.diagnosis).toBeUndefined();
    expect(encounter.class.code).toBe("EMER");
  });

  test("builds an outpatient encounter using preset defaults", () => {
    const fixture = createEncounterFixture("outpatient");
    const encounter = createEncounterBuilder({
      preset: "outpatient",
      ...toBuilderInput(fixture),
    }).build();

    expect(encounter.resourceType).toBe("Encounter");
    expect(encounter.class.code).toBe("AMB");
    expect(encounter.classHistory[0]?.class.code).toBe("AMB");
    expect(encounter.statusHistory[0]?.status).toBe("arrived");
    expect(encounter.identifier).toHaveLength(1);
    expect(encounter.serviceType?.coding?.[0]?.code).toBe("poli-interna");
    expect(encounter.priority?.coding?.[0]?.code).toBe("R");
    expect(encounter.participant).toHaveLength(2);
    expect(encounter.location[0]?.location.display).toBe("Poliklinik Penyakit Dalam");
  });

  test("supports inpatient encounters with hospitalization details", () => {
    const fixture = createEncounterFixture("inpatient");
    const encounter = createEncounterBuilder({
      preset: "inpatient",
      ...toBuilderInput(fixture),
    })
      .setInpatientHospitalization({
        ...fixture.hospitalization!,
        admitSource: "emd",
        dischargeDisposition: "home",
      })
      .build();

    expect(encounter.class.code).toBe("IMP");
    expect(encounter.hospitalization?.admitSource?.coding?.[0]?.code).toBe("emd");
    expect(encounter.hospitalization?.dischargeDisposition?.coding?.[0]?.code).toBe("home");
    expect(encounter.location[0]?.extension?.[0]).toEqual(
      createEncounterLocationServiceClassExtension({
        careSetting: "inpatient",
        serviceClass: "1",
        upgradeClass: "kelas-tetap",
      }),
    );
  });

  test("supports emergency preset and custom class overrides", () => {
    const fixture = createEncounterFixture("emergency");

    const encounter = createEncounterBuilder({
      preset: "emergency",
      ...toBuilderInput(fixture),
    })
      .setClass({
        system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
        code: "VR",
        display: "virtual",
      })
      .build();

    expect(encounter.status).toBe("in-progress");
    expect(encounter.class.code).toBe("VR");
    expect(encounter.classHistory[0]?.class.code).toBe("EMER");
    expect(encounter.statusHistory.map((entry) => entry.status)).toEqual([
      "arrived",
      "triaged",
      "in-progress",
    ]);
    expect(encounter.location).toHaveLength(2);
  });

  test("builds IGD statusHistory and classHistory from emergency stage transitions", () => {
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

    const encounter = createEncounterBuilder({
      ...emergencyFlow,
      identifier: fixture.identifier,
      ...(fixture.type ? { type: fixture.type } : {}),
      ...(fixture.serviceType ? { serviceType: fixture.serviceType } : {}),
      ...(fixture.priority ? { priority: fixture.priority } : {}),
      subject: fixture.subject,
      ...(fixture.participant ? { participant: fixture.participant } : {}),
      reasonCode: fixture.reasonCode,
      diagnosis: fixture.diagnosis,
      location: fixture.location,
      serviceProvider: fixture.serviceProvider,
    }).build();

    expect(encounter.status).toBe("in-progress");
    expect(encounter.period).toEqual({
      start: "2024-04-03T01:00:00+00:00",
      end: "2024-04-03T03:00:00+00:00",
    });
    expect(encounter.statusHistory).toEqual(fixture.statusHistory);
    expect(encounter.class.code).toBe("EMER");
    expect(encounter.classHistory).toEqual(fixture.classHistory);
  });

  test("supports class transitions from IGD to rawat inap without manual class history", () => {
    const fixture = createEncounterFixture("inpatient");
    const emergencyFlow = createEmergencyEncounterHistory({
      statusStages: [
        {
          status: "arrived",
          start: "2024-04-02T01:00:00+00:00",
        },
        {
          status: "in-progress",
          start: "2024-04-02T01:20:00+00:00",
        },
        {
          status: "finished",
          start: "2024-04-05T03:00:00+00:00",
        },
      ],
      classStages: [
        {
          start: "2024-04-02T01:00:00+00:00",
          preset: "emergency",
        },
        {
          start: "2024-04-02T03:00:00+00:00",
          preset: "inpatient",
        },
      ],
      periodEnd: "2024-04-05T05:00:00+00:00",
    });

    const encounter = createEncounterBuilder({
      ...emergencyFlow,
      identifier: fixture.identifier,
      ...(fixture.type ? { type: fixture.type } : {}),
      ...(fixture.serviceType ? { serviceType: fixture.serviceType } : {}),
      ...(fixture.priority ? { priority: fixture.priority } : {}),
      subject: fixture.subject,
      ...(fixture.participant ? { participant: fixture.participant } : {}),
      reasonCode: fixture.reasonCode,
      diagnosis: fixture.diagnosis,
      ...(fixture.hospitalization ? { hospitalization: fixture.hospitalization } : {}),
      location: fixture.location,
      serviceProvider: fixture.serviceProvider,
      ...(fixture.length ? { length: fixture.length } : {}),
    }).build();

    expect(encounter.class.code).toBe("IMP");
    expect(encounter.classHistory).toEqual(fixture.classHistory);
    expect(encounter.statusHistory).toEqual(fixture.statusHistory);
  });

  test("rejects inconsistent emergency timelines", () => {
    expect(() =>
      createEmergencyEncounterHistory({
        statusStages: [
          {
            status: "triaged",
            start: "2024-04-03T01:05:00+00:00",
          },
        ],
        periodEnd: "2024-04-03T03:00:00+00:00",
      }),
    ).toThrow("Emergency encounter flow must start with status 'arrived'");

    expect(() =>
      createEmergencyEncounterHistory({
        statusStages: [
          {
            status: "arrived",
            start: "2024-04-03T01:00:00+00:00",
          },
          {
            status: "triaged",
            start: "2024-04-03T01:05:00+00:00",
          },
        ],
        classStages: [
          {
            start: "2024-04-03T01:05:00+00:00",
            preset: "emergency",
          },
        ],
        periodEnd: "2024-04-03T03:00:00+00:00",
      }),
    ).toThrow("Emergency encounter class timeline must start at the same time");
  });

  test("builds rawat inap helpers for hospitalization and service class", () => {
    const hospitalization = createEncounterHospitalization({
      admitSource: "emd",
      destination: {
        reference: "Location/icu-bed-01",
        display: "ICU Bed 01",
      },
      dischargeDisposition: "home",
    });

    const location = withEncounterLocationServiceClass(
      {
        location: {
          reference: "Location/ward-mawar-bed-b",
          display: "Ruang Mawar Bed B",
        },
        status: "active",
      },
      { careSetting: "inpatient", serviceClass: "2" },
    );

    expect(hospitalization.admitSource?.coding?.[0]?.system).toBe(
      "http://terminology.hl7.org/CodeSystem/admit-source",
    );
    expect(hospitalization.dischargeDisposition?.coding?.[0]?.system).toBe(
      "http://terminology.hl7.org/CodeSystem/discharge-disposition",
    );
    expect(location.extension?.[0]).toEqual(
      createEncounterLocationServiceClassExtension({ careSetting: "inpatient", serviceClass: "2" }),
    );

    const fixture = createEncounterFixture("outpatient");
    const encounter = createEncounterBuilder({
      preset: "outpatient",
      ...toBuilderInput(fixture),
    })
      .setLocationServiceClass(0, { careSetting: "outpatient", serviceClass: "eksekutif" })
      .build();

    expect(encounter.location[0]?.extension?.[0]).toEqual(
      createEncounterLocationServiceClassExtension({
        careSetting: "outpatient",
        serviceClass: "eksekutif",
      }),
    );
  });
});

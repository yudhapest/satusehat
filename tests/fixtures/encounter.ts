import type { EncounterCreateInput } from "../../src";

const encounterFixtures = {
  outpatient: {
    resourceType: "Encounter",
    identifier: [
      {
        system: "http://sys-ids.kemkes.go.id/encounter/10000004",
        use: "official",
        value: "RJ-20240001",
      },
    ],
    status: "arrived",
    statusHistory: [
      {
        status: "arrived",
        period: {
          start: "2024-04-01T01:00:00+00:00",
          end: "2024-04-01T01:15:00+00:00",
        },
      },
    ],
    class: {
      system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
      code: "AMB",
      display: "ambulatory",
    },
    classHistory: [
      {
        class: {
          system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
          code: "AMB",
          display: "ambulatory",
        },
        period: {
          start: "2024-04-01T01:00:00+00:00",
          end: "2024-04-01T02:00:00+00:00",
        },
      },
    ],
    type: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/v2-0004",
            code: "O",
            display: "Outpatient",
          },
        ],
        text: "Kunjungan rawat jalan",
      },
    ],
    serviceType: {
      coding: [
        {
          system: "http://terminology.kemkes.go.id/CodeSystem/visit-service-type",
          code: "poli-interna",
          display: "Poli Penyakit Dalam",
        },
      ],
      text: "Poli Penyakit Dalam",
    },
    priority: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/v3-ActPriority",
          code: "R",
          display: "routine",
        },
      ],
      text: "Routine outpatient visit",
    },
    subject: {
      reference: "Patient/100000030009",
      display: "Budi Santoso",
    },
    participant: [
      {
        type: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
                code: "ATND",
                display: "attender",
              },
            ],
            text: "Dokter penanggung jawab pelayanan",
          },
        ],
        individual: {
          reference: "Practitioner/N10000001",
          display: "dr. Bronsig, Sp.PD",
        },
      },
      {
        type: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
                code: "PPRF",
                display: "primary performer",
              },
            ],
            text: "Perawat poli",
          },
        ],
        individual: {
          reference: "Practitioner/N10000002",
          display: "Ns. Sinta",
        },
      },
    ],
    period: {
      start: "2024-04-01T01:00:00+00:00",
      end: "2024-04-01T02:00:00+00:00",
    },
    reasonCode: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/encounter-reason",
            code: "185349003",
            display: "Encounter for check up",
          },
        ],
        text: "Kontrol rawat jalan pasca stabilisasi diabetes",
      },
    ],
    diagnosis: [
      {
        condition: {
          reference: "Condition/cond-outpatient-1",
          display: "Type 2 diabetes mellitus",
        },
        use: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/diagnosis-role",
              code: "AD",
              display: "Admission diagnosis",
            },
          ],
          text: "Diagnosis kerja",
        },
        rank: 1,
      },
    ],
    location: [
      {
        location: {
          reference: "Location/poli-interna",
          display: "Poliklinik Penyakit Dalam",
        },
        status: "active",
        period: {
          start: "2024-04-01T01:00:00+00:00",
          end: "2024-04-01T02:00:00+00:00",
        },
      },
    ],
    serviceProvider: {
      reference: "Organization/10000004",
      display: "RS SATUSEHAT",
    },
  } satisfies EncounterCreateInput,
  inpatient: {
    resourceType: "Encounter",
    identifier: [
      {
        system: "http://sys-ids.kemkes.go.id/encounter/10000004",
        use: "official",
        value: "RI-20240001",
      },
    ],
    status: "finished",
    statusHistory: [
      {
        status: "arrived",
        period: {
          start: "2024-04-02T01:00:00+00:00",
          end: "2024-04-02T01:20:00+00:00",
        },
      },
      {
        status: "in-progress",
        period: {
          start: "2024-04-02T01:20:00+00:00",
          end: "2024-04-05T03:00:00+00:00",
        },
      },
      {
        status: "finished",
        period: {
          start: "2024-04-05T03:00:00+00:00",
          end: "2024-04-05T05:00:00+00:00",
        },
      },
    ],
    class: {
      system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
      code: "IMP",
      display: "inpatient encounter",
    },
    classHistory: [
      {
        class: {
          system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
          code: "EMER",
          display: "emergency",
        },
        period: {
          start: "2024-04-02T01:00:00+00:00",
          end: "2024-04-02T03:00:00+00:00",
        },
      },
      {
        class: {
          system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
          code: "IMP",
          display: "inpatient encounter",
        },
        period: {
          start: "2024-04-02T03:00:00+00:00",
          end: "2024-04-05T05:00:00+00:00",
        },
      },
    ],
    type: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/v2-0004",
            code: "I",
            display: "Inpatient",
          },
        ],
        text: "Perawatan rawat inap dewasa",
      },
    ],
    serviceType: {
      coding: [
        {
          system: "http://terminology.kemkes.go.id/CodeSystem/visit-service-type",
          code: "rawat-inap-interna",
          display: "Rawat Inap Penyakit Dalam",
        },
      ],
      text: "Rawat Inap Penyakit Dalam",
    },
    priority: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/v3-ActPriority",
          code: "UR",
          display: "urgent",
        },
      ],
      text: "Urgent admission from emergency department",
    },
    subject: {
      reference: "Patient/100000030009",
      display: "Budi Santoso",
    },
    participant: [
      {
        type: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
                code: "ATND",
                display: "attender",
              },
            ],
            text: "DPJP rawat inap",
          },
        ],
        individual: {
          reference: "Practitioner/N10000003",
          display: "dr. Rina, Sp.PD",
        },
      },
      {
        type: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
                code: "PPRF",
                display: "primary performer",
              },
            ],
            text: "Perawat ruangan",
          },
        ],
        individual: {
          reference: "Practitioner/N10000004",
          display: "Ns. Diah",
        },
      },
    ],
    period: {
      start: "2024-04-02T01:00:00+00:00",
      end: "2024-04-05T05:00:00+00:00",
    },
    length: {
      value: 3,
      unit: "days",
      system: "http://unitsofmeasure.org",
      code: "d",
    },
    reasonCode: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/encounter-reason",
            code: "32485007",
            display: "Hospital admission",
          },
        ],
        text: "Perawatan pneumonia komunitas dengan hipoksemia",
      },
    ],
    diagnosis: [
      {
        condition: {
          reference: "Condition/cond-inpatient-1",
          display: "Community acquired pneumonia",
        },
        use: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/diagnosis-role",
              code: "AD",
              display: "Admission diagnosis",
            },
          ],
          text: "Diagnosis masuk",
        },
        rank: 1,
      },
    ],
    hospitalization: {
      preAdmissionIdentifier: {
        system: "http://sys-ids.kemkes.go.id/encounter/10000004",
        value: "PREADM-20240001",
      },
      origin: {
        reference: "Location/igd-01",
        display: "Instalasi Gawat Darurat",
      },
      admitSource: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/admit-source",
            code: "emd",
            display: "From accident/emergency department",
          },
        ],
        text: "Rujukan internal dari IGD",
      },
      destination: {
        reference: "Location/home-care-transition",
        display: "Transisi pulang",
      },
      dischargeDisposition: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/discharge-disposition",
            code: "home",
            display: "Home",
          },
        ],
        text: "Pulang ke rumah dengan edukasi kontrol",
      },
    },
    location: [
      {
        location: {
          reference: "Location/ward-mawar-bed-a",
          display: "Ruang Mawar Bed A",
        },
        status: "completed",
        physicalType: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/location-physical-type",
              code: "bd",
              display: "Bed",
            },
          ],
        },
        period: {
          start: "2024-04-02T03:00:00+00:00",
          end: "2024-04-05T05:00:00+00:00",
        },
        extension: [
          {
            url: "https://fhir.kemkes.go.id/r4/StructureDefinition/serviceClass",
            extension: [
              {
                url: "valueCode",
                valueCode: "kelas-1",
              },
            ],
          },
        ],
      },
    ],
    serviceProvider: {
      reference: "Organization/10000004",
      display: "RS SATUSEHAT",
    },
  } satisfies EncounterCreateInput,
  emergency: {
    resourceType: "Encounter",
    identifier: [
      {
        system: "http://sys-ids.kemkes.go.id/encounter/10000004",
        use: "official",
        value: "IGD-20240001",
      },
    ],
    status: "in-progress",
    statusHistory: [
      {
        status: "arrived",
        period: {
          start: "2024-04-03T01:00:00+00:00",
          end: "2024-04-03T01:05:00+00:00",
        },
      },
      {
        status: "triaged",
        period: {
          start: "2024-04-03T01:05:00+00:00",
          end: "2024-04-03T01:15:00+00:00",
        },
      },
      {
        status: "in-progress",
        period: {
          start: "2024-04-03T01:15:00+00:00",
          end: "2024-04-03T03:00:00+00:00",
        },
      },
    ],
    class: {
      system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
      code: "EMER",
      display: "emergency",
    },
    classHistory: [
      {
        class: {
          system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
          code: "EMER",
          display: "emergency",
        },
        period: {
          start: "2024-04-03T01:00:00+00:00",
          end: "2024-04-03T03:00:00+00:00",
        },
      },
    ],
    type: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/v2-0004",
            code: "E",
            display: "Emergency",
          },
        ],
        text: "Pelayanan gawat darurat",
      },
    ],
    serviceType: {
      coding: [
        {
          system: "http://terminology.kemkes.go.id/CodeSystem/visit-service-type",
          code: "igd",
          display: "Instalasi Gawat Darurat",
        },
      ],
      text: "Pelayanan IGD",
    },
    priority: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/v3-ActPriority",
          code: "A",
          display: "ASAP",
        },
      ],
      text: "Triage prioritas segera",
    },
    subject: {
      reference: "Patient/100000030009",
      display: "Budi Santoso",
    },
    participant: [
      {
        type: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
                code: "PPRF",
                display: "primary performer",
              },
            ],
            text: "Perawat triase",
          },
        ],
        individual: {
          reference: "Practitioner/N10000005",
          display: "Ns. Tia",
        },
      },
      {
        type: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
                code: "ATND",
                display: "attender",
              },
            ],
            text: "Dokter jaga IGD",
          },
        ],
        individual: {
          reference: "Practitioner/N10000006",
          display: "dr. Andi",
        },
      },
    ],
    period: {
      start: "2024-04-03T01:00:00+00:00",
      end: "2024-04-03T03:00:00+00:00",
    },
    reasonCode: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/encounter-reason",
            code: "29857009",
            display: "Chest pain",
          },
        ],
        text: "Nyeri dada akut sejak 2 jam sebelum datang",
      },
    ],
    diagnosis: [
      {
        condition: {
          reference: "Condition/cond-emergency-1",
          display: "Acute chest pain",
        },
        use: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/diagnosis-role",
              code: "DD",
              display: "Discharge diagnosis",
            },
          ],
          text: "Diagnosis kerja IGD",
        },
        rank: 1,
      },
    ],
    location: [
      {
        location: {
          reference: "Location/igd-triage",
          display: "Area Triage IGD",
        },
        status: "completed",
        period: {
          start: "2024-04-03T01:00:00+00:00",
          end: "2024-04-03T01:15:00+00:00",
        },
      },
      {
        location: {
          reference: "Location/igd-resus-02",
          display: "Bed Observasi IGD 02",
        },
        status: "active",
        period: {
          start: "2024-04-03T01:15:00+00:00",
          end: "2024-04-03T03:00:00+00:00",
        },
      },
    ],
    serviceProvider: {
      reference: "Organization/10000004",
      display: "RS SATUSEHAT",
    },
  } satisfies EncounterCreateInput,
} as const;

export type EncounterFixtureUseCase = keyof typeof encounterFixtures;

export const encounterFixtureUseCases = Object.keys(encounterFixtures) as EncounterFixtureUseCase[];

export function createEncounterFixture(useCase: EncounterFixtureUseCase): EncounterCreateInput {
  return structuredClone(encounterFixtures[useCase]);
}

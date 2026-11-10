# Laboratory Panel Builder

## Ringkasan

Helper `createLaboratoryPanelBuilder` membantu alur panel laboratorium dengan komponen:

- `ServiceRequest`
- `Specimen`
- banyak `Observation`
- satu `DiagnosticReport`

Helper ini cocok untuk use case seperti hematologi lengkap, kimia klinik, atau panel pemeriksaan lain yang menghasilkan beberapa `Observation` lalu dirangkum di satu `DiagnosticReport`.

## Contoh Dasar

```ts
import {
  createEncounterBuilder,
  createLaboratoryPanelBuilder,
} from "@digitalmedika/satusehat";

const encounterDraft = createEncounterBuilder({
  preset: "outpatient",
  identifier: {
    system: "http://sys-ids.kemkes.go.id/encounter/10000004",
    use: "official",
    value: "LAB-20240001",
  },
  status: "arrived",
  subject: {
    reference: "Patient/100000030009",
    display: "Budi Santoso",
  },
  period: {
    start: "2024-04-01T01:00:00+00:00",
    end: "2024-04-01T02:00:00+00:00",
  },
  reasonCode: {
    coding: [
      {
        system: "http://terminology.hl7.org/CodeSystem/encounter-reason",
        code: "185349003",
        display: "Encounter for check up",
      },
    ],
  },
  diagnosis: {
    condition: {
      reference: "Condition/4bbbe654-14f5-4ab3-a36e-a1e307f67bb8",
    },
    use: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/diagnosis-role",
          code: "AD",
          display: "Admission diagnosis",
        },
      ],
    },
    rank: 1,
  },
  location: {
    location: {
      reference: "Location/poli-lab",
      display: "Poliklinik Rawat Jalan",
    },
    status: "active",
  },
  serviceProvider: {
    reference: "Organization/10000004",
  },
}).build();

const createdEncounter = await client.encounter.create(encounterDraft);

const builder = createLaboratoryPanelBuilder({
  subject: encounterDraft.subject,
  encounter: {
    reference: `Encounter/${createdEncounter.id}`,
  },
  serviceRequest: {
    status: "active",
    intent: "order",
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "58410-2",
          display: "Complete blood count panel",
        },
      ],
    },
  },
  specimen: {
    status: "available",
    type: {
      coding: [
        {
          system: "http://snomed.info/sct",
          code: "119364003",
          display: "Serum specimen",
        },
      ],
    },
  },
  diagnosticReport: {
    status: "final",
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "58410-2",
          display: "Complete blood count panel",
        },
      ],
    },
  },
  observationDefaults: {
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "laboratory",
            display: "Laboratory",
          },
        ],
      },
    ],
  },
})
  .addObservation("hemoglobin", {
    status: "final",
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "718-7",
          display: "Hemoglobin",
        },
      ],
    },
  })
  .setObservationValueQuantity("hemoglobin", {
    value: 13.5,
    unit: "g/dL",
    system: "http://unitsofmeasure.org",
    code: "g/dL",
  })
  .addObservation("hematocrit", {
    status: "final",
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "4544-3",
          display: "Hematocrit",
        },
      ],
    },
  })
  .setObservationValueQuantity("hematocrit", {
    value: 41,
    unit: "%",
    system: "http://unitsofmeasure.org",
    code: "%",
  });

const serviceRequest = await client.serviceRequest.create(builder.buildServiceRequest());
const specimen = await client.specimen.create(
  builder.buildSpecimen({
    serviceRequestId: serviceRequest.id,
  }),
);

const observationEntries = builder.buildObservationEntries({
  serviceRequestId: serviceRequest.id,
  specimenId: specimen.id,
});

const createdObservations = [];

for (const entry of observationEntries) {
  const createdObservation = await client.observation.create(entry.body);
  createdObservations.push({
    key: entry.key,
    id: createdObservation.id,
  });
}

const diagnosticReport = await client.diagnosticReport.create(
  builder.buildDiagnosticReport({
    serviceRequestId: serviceRequest.id,
    specimenId: specimen.id,
    resultIds: createdObservations.map((item) => item.id),
  }),
);
```

## Integrasi dengan Encounter Builder

Karena `createLaboratoryPanelBuilder(...)` butuh `subject` dan `encounter`, helper ini cocok dipasangkan dengan `createEncounterBuilder(...)` saat alur kunjungan dan order laboratorium dibuat dalam proses yang sama.

Data yang biasanya diteruskan:

- `subject` dari draft encounter
- reference `Encounter/{createdEncounter.id}` setelah encounter berhasil dibuat

## Helper yang Tersedia

- `setSubject`
- `setEncounter`
- `mergeServiceRequest`
- `mergeSpecimen`
- `mergeDiagnosticReport`
- `setObservationDefaults`
- `addObservation`
- `mergeObservation`
- `setObservationValueQuantity`
- `addObservationNote`
- `addServiceRequestNote`
- `addSpecimenNote`
- `setSpecimenCollection`
- `addSpecimenContainer`
- `listObservationKeys`
- `buildServiceRequest`
- `buildSpecimen`
- `buildObservation`
- `buildObservationEntries`
- `buildObservations`
- `buildDiagnosticReport`

## Catatan

- `addObservation(key, ...)` memakai key stabil supaya Anda bisa melacak hasil create per item panel.
- `buildObservationEntries(...)` cocok untuk loop create yang butuh pasangan `key` dan `body`.
- `buildDiagnosticReport(...)` menerima `resultIds` atau `resultReferences` untuk menghubungkan semua hasil `Observation` yang sudah dibuat.

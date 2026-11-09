# ServiceRequest -> Specimen -> Observation Builder

## Ringkasan

Helper `createServiceRequestSpecimenObservationBuilder` membantu menyusun payload berantai untuk alur:

- `ServiceRequest`
- `Specimen`
- `Observation`
- `DiagnosticReport`

Builder ini cocok saat resource dibuat bertahap. `ServiceRequest` biasanya dibuat lebih dulu, lalu ID hasil create dipakai untuk mengisi relasi pada `Specimen` dan `Observation`.

## Contoh Dasar

```ts
import {
  createEncounterBuilder,
  createServiceRequestSpecimenObservationBuilder,
} from "@digitalmedika/satusehat";

const encounterDraft = createEncounterBuilder({
  preset: "outpatient",
  identifier: {
    system: "http://sys-ids.kemkes.go.id/encounter/10000004",
    use: "official",
    value: "RJ-20240001",
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
      reference: "Location/poli-interna",
      display: "Poliklinik Penyakit Dalam",
    },
    status: "active",
  },
  serviceProvider: {
    reference: "Organization/10000004",
  },
}).build();

const createdEncounter = await client.encounter.create(encounterDraft);

const builder = createServiceRequestSpecimenObservationBuilder({
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
  observation: {
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
})
  .mergeServiceRequest({
    authoredOn: "2024-04-01T02:45:00+00:00",
  })
  .setSpecimenCollection({
    collector: {
      reference: "Practitioner/N10000001",
    },
    collectedDateTime: "2024-04-01T03:00:00+00:00",
  })
  .setObservationValueQuantity({
    value: 13.5,
    unit: "g/dL",
    system: "http://unitsofmeasure.org",
    code: "g/dL",
  });

const serviceRequestBody = builder.buildServiceRequest();
const createdServiceRequest = await client.serviceRequest.create(serviceRequestBody);

const specimenBody = builder.buildSpecimen({
  serviceRequestId: createdServiceRequest.id,
});
const createdSpecimen = await client.specimen.create(specimenBody);

const observationBody = builder.buildObservation({
  serviceRequestId: createdServiceRequest.id,
  specimenId: createdSpecimen.id,
});
const createdObservation = await client.observation.create(observationBody);

const diagnosticReportBody = builder.buildDiagnosticReport({
  serviceRequestId: createdServiceRequest.id,
  specimenId: createdSpecimen.id,
  resultId: createdObservation.id,
});
const diagnosticReport = await client.diagnosticReport.create(diagnosticReportBody);
```

## Alur yang Direkomendasikan

Kalau encounter memang dibuat di flow yang sama, pola yang paling enak biasanya:

1. Susun draft `Encounter` dengan `createEncounterBuilder(...)`
2. Simpan dengan `client.encounter.create(...)`
3. Teruskan `subject` yang sama dan reference `Encounter/{id}` ke builder lanjutan

Dengan begitu, konteks kunjungan pasien tetap konsisten dari `Encounter` ke `ServiceRequest`, `Specimen`, `Observation`, dan `DiagnosticReport`.

## Auto-Link yang Dibantu

- `buildServiceRequest()` mengembalikan payload `ServiceRequest` dengan `subject` dan `encounter` bersama.
- `buildSpecimen({ serviceRequestId })` otomatis menambahkan `Specimen.request = [{ reference: "ServiceRequest/{id}" }]`.
- `buildObservation({ serviceRequestId, specimenId })` otomatis menambahkan:
`Observation.basedOn = [{ reference: "ServiceRequest/{id}" }]`
`Observation.specimen = { reference: "Specimen/{id}" }`
- `buildDiagnosticReport({ serviceRequestId, specimenId, resultId })` otomatis menambahkan:
`DiagnosticReport.basedOn = [{ reference: "ServiceRequest/{id}" }]`
`DiagnosticReport.specimen = [{ reference: "Specimen/{id}" }]`
`DiagnosticReport.result = [{ reference: "Observation/{id}" }]`

Kalau Anda sudah punya object reference lengkap, bisa pakai `serviceRequestReference` atau `specimenReference` sebagai pengganti ID.

## Helper yang Tersedia

- `setSubject`
- `setEncounter`
- `mergeServiceRequest`
- `mergeSpecimen`
- `mergeObservation`
- `setDiagnosticReport`
- `mergeDiagnosticReport`
- `addServiceRequestNote`
- `addSpecimenNote`
- `addObservationNote`
- `setSpecimenCollection`
- `addSpecimenContainer`
- `setObservationValueQuantity`
- `buildServiceRequest`
- `buildSpecimen`
- `buildObservation`
- `buildDiagnosticReport`

## Catatan

- Builder ini tidak melakukan create ke API; tugasnya hanya menyusun payload yang sudah tervalidasi schema SDK.
- Jika satu `ServiceRequest` menghasilkan beberapa `Observation`, Anda bisa memanggil `buildObservation(...)` berkali-kali dengan ID yang sama dan mengubah draft lewat `mergeObservation(...)` di antara pemanggilan.

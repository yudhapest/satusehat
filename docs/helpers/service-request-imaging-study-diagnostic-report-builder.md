# ServiceRequest -> ImagingStudy -> DiagnosticReport Builder

## Ringkasan

Helper `createServiceRequestImagingStudyDiagnosticReportBuilder` membantu menyusun payload berantai untuk alur radiologi:

- `ServiceRequest`
- `ImagingStudy`
- `DiagnosticReport`

Builder ini cocok saat order radiologi dibuat lebih dulu, lalu hasil citra `ImagingStudy` dan bacaan radiolog `DiagnosticReport` dibuat bertahap setelah ID resource sebelumnya tersedia.

## Contoh Dasar

```ts
import {
  createEncounterBuilder,
  createServiceRequestImagingStudyDiagnosticReportBuilder,
} from "@digitalmedika/satusehat";

const encounterDraft = createEncounterBuilder({
  preset: "emergency",
  identifier: {
    system: "http://sys-ids.kemkes.go.id/encounter/10000004",
    use: "official",
    value: "RAD-20240001",
  },
  status: "triaged",
  subject: {
    reference: "Patient/100000030009",
    display: "Budi Santoso",
  },
  period: {
    start: "2024-04-01T01:00:00+00:00",
    end: "2024-04-01T03:00:00+00:00",
  },
  reasonCode: {
    coding: [
      {
        system: "http://terminology.hl7.org/CodeSystem/encounter-reason",
        code: "308335008",
        display: "Patient encounter procedure",
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
      reference: "Location/radiology",
      display: "Radiologi",
    },
    status: "active",
  },
  serviceProvider: {
    reference: "Organization/10000004",
  },
}).build();

const createdEncounter = await client.encounter.create(encounterDraft);

const builder = createServiceRequestImagingStudyDiagnosticReportBuilder({
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
          code: "30745-4",
          display: "CT Chest W contrast IV",
        },
      ],
    },
  },
  imagingStudy: {
    identifier: [
      {
        system: "http://sys-ids.kemkes.go.id/acsn/10000004",
        use: "usual",
        value: "CT.240401.001",
      },
    ],
    status: "available",
    modality: [
      {
        system: "http://dicom.nema.org/resources/ontology/DCM",
        code: "CT",
        display: "Computed Tomography",
      },
    ],
  },
  diagnosticReport: {
    status: "final",
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "18748-4",
          display: "Diagnostic imaging study",
        },
      ],
    },
  },
})
  .mergeImagingStudy({
    started: "2024-04-01T03:30:00+00:00",
    description: "CT thorax dengan kontras.",
  })
  .addImagingStudySeries({
    uid: "1.2.48.670589.30.39.0.1.966169786508.1664950724077.1",
    modality: {
      system: "http://dicom.nema.org/resources/ontology/DCM",
      code: "CT",
      display: "Computed Tomography",
    },
  })
  .mergeDiagnosticReport({
    conclusion: "Tidak tampak efusi pleura. Infiltrat ringan paru kanan atas.",
  });

const serviceRequest = await client.serviceRequest.create(builder.buildServiceRequest());

const imagingStudy = await client.imagingStudy.create(
  builder.buildImagingStudy({
    serviceRequestId: serviceRequest.id,
  }),
);

const diagnosticReport = await client.diagnosticReport.create(
  builder.buildDiagnosticReport({
    serviceRequestId: serviceRequest.id,
    imagingStudyId: imagingStudy.id,
  }),
);
```

## Integrasi dengan Encounter Builder

Untuk workflow radiologi yang dimulai dari kunjungan IGD atau rawat jalan, `createEncounterBuilder(...)` bisa dipakai untuk menjaga `subject` dan reference encounter tetap konsisten sebelum order radiologi dibuat.

## Auto-Link yang Dibantu

- `buildServiceRequest()` mengembalikan payload `ServiceRequest` dengan `subject` dan `encounter` bersama.
- `buildImagingStudy({ serviceRequestId })` otomatis menambahkan:
`ImagingStudy.basedOn = [{ reference: "ServiceRequest/{id}" }]`
- `buildDiagnosticReport({ serviceRequestId, imagingStudyId })` otomatis menambahkan:
`DiagnosticReport.basedOn = [{ reference: "ServiceRequest/{id}" }]`
`DiagnosticReport.imagingStudy = [{ reference: "ImagingStudy/{id}" }]`

Kalau Anda sudah punya object reference lengkap, bisa pakai `serviceRequestReference` atau `imagingStudyReference` sebagai pengganti ID.

## Helper yang Tersedia

- `setSubject`
- `setEncounter`
- `mergeServiceRequest`
- `mergeImagingStudy`
- `mergeDiagnosticReport`
- `addServiceRequestNote`
- `addImagingStudyNote`
- `addImagingStudySeries`
- `addDiagnosticReportMedia`
- `buildServiceRequest`
- `buildImagingStudy`
- `buildDiagnosticReport`

## Catatan

- Builder ini tidak melakukan create ke API; tugasnya hanya menyusun payload yang tervalidasi schema SDK.
- `buildImagingStudy(...)` memang mewajibkan link ke `ServiceRequest`, karena `ImagingStudy.basedOn` adalah field wajib di schema SDK saat ini.

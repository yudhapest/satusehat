# Chest X-Ray Study Builder

## Ringkasan

Helper `createChestXRayStudyBuilder` adalah preset radiologi di atas `createServiceRequestImagingStudyDiagnosticReportBuilder` untuk workflow foto thoraks / chest X-ray.

Preset ini sudah menyiapkan:

- kode `ServiceRequest` chest X-ray LOINC `42272-5`
- `ImagingStudy.modality` default `CR`
- `ImagingStudy.identifier` dari `organizationId` dan `accessionNumber`
- kategori `DiagnosticReport` radiologi (`RAD`)
- kode `DiagnosticReport` sama dengan order radiologi

## Contoh Dasar

```ts
import {
  createChestXRayStudyBuilder,
  createEncounterBuilder,
} from "@digitalmedika/satusehat";

const encounterDraft = createEncounterBuilder({
  preset: "emergency",
  identifier: {
    system: "http://sys-ids.kemkes.go.id/encounter/10000004",
    use: "official",
    value: "IGD-20240001",
  },
  status: "triaged",
  subject: {
    reference: "Patient/100000030009",
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
      reference: "Location/igd-01",
      display: "Instalasi Gawat Darurat",
    },
    status: "active",
  },
  serviceProvider: {
    reference: "Organization/10000004",
  },
}).build();

const createdEncounter = await client.encounter.create(encounterDraft);

const builder = createChestXRayStudyBuilder({
  subject: encounterDraft.subject,
  encounter: {
    reference: `Encounter/${createdEncounter.id}`,
  },
  organizationId: "10000004",
  accessionNumber: "XR.240401.001",
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

## Input Penting

- `organizationId`
  Dipakai untuk membentuk `ImagingStudy.identifier[0].system` menjadi `http://sys-ids.kemkes.go.id/acsn/{organizationId}`.
- `accessionNumber`
  Dipakai untuk mengisi `ImagingStudy.identifier[0].value`.
- `identifierUse`
  Opsional, default `usual`.

## Override Default

Anda tetap bisa override draft default jika perlu:

```ts
const builder = createChestXRayStudyBuilder({
  subject: encounterDraft.subject,
  encounter: {
    reference: `Encounter/${createdEncounter.id}`,
  },
  organizationId: "10000004",
  accessionNumber: "XR.240401.002",
  imagingStudy: {
    description: "Portable AP chest radiograph",
  },
  diagnosticReport: {
    conclusion: "Tidak tampak infiltrat aktif.",
  },
});
```

## Catatan

- Helper ini mengembalikan `ServiceRequestImagingStudyDiagnosticReportBuilder`, jadi helper lanjutan seperti `addImagingStudySeries(...)`, `addImagingStudyNote(...)`, atau `mergeDiagnosticReport(...)` tetap bisa dipakai.
- Default LOINC chest X-ray yang dipakai di preset ini adalah `42272-5` untuk `XR Chest PA and Lateral`, dan kategori `DiagnosticReport` memakai kode HL7 `RAD` untuk radiologi.

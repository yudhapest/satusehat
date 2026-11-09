# Getting Started

## Instalasi

Untuk consumer package:

```bash
npm install https://github.com/yudhapest/satusehat/releases/download/v0.10.3/digitalmedika-satusehat-0.10.3.tgz
```

Untuk development repository ini:

```bash
npm install
```

## Konfigurasi Environment

Salin `.env.example` menjadi `.env`.

```env
SATUSEHAT_ENV=sandbox
SATUSEHAT_BASE_URL=https://api-satusehat-stg.dto.kemkes.go.id/fhir-r4/v1
SATUSEHAT_AUTH_BASE_URL=https://api-satusehat-stg.dto.kemkes.go.id/oauth2/v1
SATUSEHAT_DICOM_BASE_URL=https://api-satusehat-stg.dto.kemkes.go.id
SATUSEHAT_CLIENT_ID=your-client-id
SATUSEHAT_CLIENT_SECRET=your-client-secret
SATUSEHAT_TOKEN_CACHE_FILE=.satusehat/token.json
```

## Membuat Client

### Dari environment

```ts
import { createSatuSehatClientFromEnv } from "@digitalmedika/satusehat";

const client = createSatuSehatClientFromEnv();
```

### Dari konfigurasi manual

```ts
import { createSatuSehatClient } from "@digitalmedika/satusehat";

const client = createSatuSehatClient({
  environment: "sandbox",
  credentials: {
    clientId: process.env.SATUSEHAT_CLIENT_ID!,
    clientSecret: process.env.SATUSEHAT_CLIENT_SECRET!,
  },
});
```

## Alur Pertama

Flow yang paling umum biasanya:

1. Cari atau ambil `Patient`
2. Buat `Encounter`
3. Buat resource lanjutan yang menempel ke encounter itu, misalnya order lab, observasi, radiologi, atau risk assessment

Contoh paling sederhana untuk mulai:

```ts
const patientResult = await client.patient.search({
  identifier: "https://fhir.kemkes.go.id/id/nik|9271060312000001",
});

const patient = patientResult.entry?.[0]?.resource;

if (!patient?.id) {
  throw new Error("Patient tidak ditemukan");
}

console.log(patient.id);
```

### Hasil Search dan `outcomes`

SATUSEHAT bisa menyisipkan `OperationOutcome` ke dalam hasil search, misalnya untuk data yang disembunyikan karena aturan consent atau privasi pasien. SDK memisahkannya:

- `entry` hanya berisi resource yang dicari (misalnya `Condition`)
- `outcomes` berisi `OperationOutcome` tersebut, dan hanya ada bila server mengirimkannya

```ts
const result = await client.condition.search({ subject: patient.id });

const conditions = result.entry?.map((entry) => entry.resource) ?? [];
const suppressed = result.outcomes?.filter((outcome) =>
  outcome.issue.some((issue) => issue.code === "suppressed"),
);

console.log(`${conditions.length} diagnosis, ${suppressed?.length ?? 0} disembunyikan karena consent`);
```

`total` tetap mengikuti nilai dari server, jadi bisa lebih besar dari jumlah `entry`. Pemisahan ini hanya terjadi saat validasi response aktif (default). Dengan `validateResponse: false`, response dikembalikan apa adanya.

## Contoh End-to-End Sederhana

Contoh ini menunjukkan pola yang direkomendasikan:

- cari patient lebih dulu
- buat draft encounter dengan `createEncounterBuilder(...)`
- simpan encounter
- teruskan `subject` dan `Encounter/{id}` ke helper berikutnya

```ts
import {
  createEncounterBuilder,
  createLaboratoryPanelBuilder,
  createSatuSehatClientFromEnv,
} from "@digitalmedika/satusehat";

const client = createSatuSehatClientFromEnv();

const patientResult = await client.patient.search({
  identifier: "https://fhir.kemkes.go.id/id/nik|9271060312000001",
});

const patient = patientResult.entry?.[0]?.resource;

if (!patient?.id) {
  throw new Error("Patient tidak ditemukan");
}

const encounterDraft = createEncounterBuilder({
  preset: "outpatient",
  identifier: {
    system: "http://sys-ids.kemkes.go.id/encounter/10000004",
    use: "official",
    value: "RJ-20240001",
  },
  status: "arrived",
  subject: {
    reference: `Patient/${patient.id}`,
    display: patient.name?.[0]?.text ?? "Pasien SATUSEHAT",
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
          system: "https://www.hl7.org/fhir/Codesystem-diagnosis-role",
          code: "AD",
          display: "Admission diagnosis",
        },
      ],
    },
    rank: 1,
  },
  location: {
    location: {
      reference: "Location/408ba28c-3115-4df5-85c6-60f15b44e7fa",
      display: "Poliklinik Rawat Jalan",
    },
    status: "active",
  },
  serviceProvider: {
    reference: "Organization/10000004",
    display: "RS SATUSEHAT",
  },
}).build();

const encounter = await client.encounter.create(encounterDraft);

const labBuilder = createLaboratoryPanelBuilder({
  subject: encounterDraft.subject,
  encounter: {
    reference: `Encounter/${encounter.id}`,
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
  });

const serviceRequest = await client.serviceRequest.create(
  labBuilder.buildServiceRequest(),
);

console.log({
  patientId: patient.id,
  encounterId: encounter.id,
  serviceRequestId: serviceRequest.id,
});
```

## Kapan Pakai Builder

Builder paling berguna saat:

- payload resource cukup panjang dan banyak field wajib
- ada beberapa resource yang harus memakai `subject` dan `encounter` yang sama
- kamu ingin menyusun draft bertahap di service layer

Builder yang biasanya jadi titik awal:

- `createEncounterBuilder(...)`
- `createLaboratoryPanelBuilder(...)`
- `createCompleteBloodCountPanelBuilder(...)`
- `createServiceRequestSpecimenObservationBuilder(...)`
- `createServiceRequestImagingStudyDiagnosticReportBuilder(...)`
- `createChestXRayStudyBuilder(...)`
- `createRiskAssessmentBuilder(...)`

## Resource yang Sudah Tersedia

Saat ini resource yang sudah tersedia di SDK:

- `allergyIntolerance`
- `carePlan`
- `clinicalImpression`
- `composition`
- `condition`
- `diagnosticReport`
- `dicomRouter`
- `encounter`
- `imagingStudy`
- `immunization`
- `location`
- `medication`
- `medicationAdministration`
- `medicationRequest`
- `nutritionOrder`
- `observation`
- `organization`
- `patient`
- `practitioner`
- `practitionerRole`
- `procedure`
- `questionnaireResponse`
- `riskAssessment`
- `serviceRequest`
- `specimen`

## Contoh Lanjutan

Setelah flow dasar jalan, biasanya langkah berikutnya adalah memilih helper sesuai kebutuhan:

- workflow laboratorium: lihat [Laboratory Panel Builder](./helpers/laboratory-panel-builder.md)
- workflow specimen tunggal: lihat [ServiceRequest -> Specimen -> Observation Builder](./helpers/service-request-specimen-observation-builder.md)
- workflow radiologi: lihat [ServiceRequest -> ImagingStudy -> DiagnosticReport Builder](./helpers/service-request-imaging-study-diagnostic-report-builder.md)
- workflow chest X-ray: lihat [Chest X-Ray Study Builder](./helpers/chest-xray-study-builder.md)
- assessment klinis: lihat [Risk Assessment Builder](./helpers/risk-assessment-builder.md)
- encounter dasar: lihat [Encounter Builder](./helpers/encounter-builder.md)

## Download DICOM Router Config

```ts
const dockerCompose = await client.dicomRouter.downloadConfig();

console.log(dockerCompose);
```

## Verifikasi Lokal

```bash
npm run typecheck
npm test
npm run smoke:live
npm run smoke:sandbox
```

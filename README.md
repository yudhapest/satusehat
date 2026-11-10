# @digitalmedika/satusehat

Type-safe TypeScript SDK untuk SATUSEHAT API.

SDK ini dirancang untuk:

- validasi request dan response dengan runtime schema
- type inference end-to-end di TypeScript
- OAuth2 client credentials
- token cache in-memory atau file-based
- ergonomi SDK yang cocok untuk backend service dan internal tooling

## Helpers

Helper builder yang saat ini tersedia:

- `createEncounterBuilder`
- `createEncounterClassFromConsultationMethod`
- `createEncounterDiagnosis`
- `createEncounterConditionBuilder`
- `createEncounterIdentifier`
- `createEncounterLocation`
- `createEncounterParticipant`
- `createEncounterQueueBuilder`
- `createEncounterServiceProviderReference`
- `createEncounterStatusTimeline`
- `createEncounterMedicationBuilder`
- `createEncounterMedicationAdministrationBuilder`
- `createEncounterMedicationRequestBuilder`
- `createEncounterProcedureBuilder`
- `createEmergencyEncounterHistory`
- `createChestXRayStudyBuilder`
- `createCompleteBloodCountPanelBuilder`
- `createLaboratoryPanelBuilder`
- `createOrganizationBuilder`
- `createRiskAssessmentBuilder`
- `createServiceRequestImagingStudyDiagnosticReportBuilder`
- `createServiceRequestSpecimenObservationBuilder`

## Installation

Fork ini tidak di-publish ke npm. Setiap tag rilis, CI mem-build tarball dan melampirkannya ke GitHub Release. Install dari URL tarball tersebut:

```bash
npm install https://github.com/yudhapest/satusehat/releases/download/v0.11.0/digitalmedika-satusehat-0.11.0.tgz
```

Jangan install via `github:yudhapest/satusehat`: repo tidak menyimpan `dist/`, dan npm 11 gagal menyiapkan dependency git yang perlu di-build.

Untuk mencoba perubahan di consumer sebelum rilis, lihat [docs/releasing.md](./docs/releasing.md#development-bersama-consumer).

Untuk development library ini sendiri (Node.js >= 24):

```bash
npm install
```

## Quick Start

```ts
import {
  createEncounterBuilder,
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

console.log({
  patientId: patient.id,
  encounterId: encounter.id,
});
```

## Environment Variables

Salin template dari [.env.example](./.env.example).

Variable utama:

- `SATUSEHAT_ENV`
- `SATUSEHAT_BASE_URL`
- `SATUSEHAT_AUTH_BASE_URL`
- `SATUSEHAT_DICOM_BASE_URL`
- `SATUSEHAT_CLIENT_ID`
- `SATUSEHAT_CLIENT_SECRET`
- `SATUSEHAT_TOKEN_CACHE_FILE`

## Available Resources

Saat ini resource yang sudah tersedia:

- `allergyIntolerance`
- `carePlan`
- `clinicalImpression`
- `composition`
- `condition`
- `dicomRouter`
- `diagnosticReport`
- `encounter`
- `episodeOfCare`
- `familyMemberHistory`
- `imagingStudy`
- `immunization`
- `medicationAdministration`
- `observation`
- `nutritionOrder`
- `procedure`
- `medication`
- `medicationRequest`
- `serviceRequest`
- `specimen`
- `patient`
- `organization`
- `location`
- `practitioner`
- `practitionerRole`
- `questionnaireResponse`
- `riskAssessment`

## Token Handling

Secara default SDK mendukung:

- token provider berbasis OAuth2 client credentials
- cache token in-memory
- file-based token store opsional untuk local testing/internal tools
- refresh otomatis saat token expired atau mendekati expired
- retry sekali saat menerima `401` jika token bisa di-invalidasi

## Development

```bash
npm run typecheck
npm test
npm run build

# atau semuanya sekaligus
npm run verify
```

Test memakai runner bawaan Node (`node:test`, dijalankan lewat `tsx --test`) dengan helper `expect` di `tests/helpers/expect.ts`.

Smoke test ke SATUSEHAT live:

```bash
npm run smoke:live
```

Untuk environment `sandbox`, smoke test akan memakai dummy patient resmi SATUSEHAT bila parameter test belum diisi.

Pengecekan read-only ke beberapa resource di sandbox (Organization, Location, Practitioner, Patient, Encounter, Condition). Semua request berupa GET dan respons divalidasi dengan schema SDK:

```bash
npm run smoke:sandbox
```

Script ini menolak berjalan bila environment bukan `sandbox`, dan membutuhkan `SATUSEHAT_ORGANIZATION_ID`.

Uji alur kirim data kunjungan ke sandbox secara real-time, seperti yang dilakukan SIMRS, lalu dibaca ulang:

- `rajal`: `Encounter` arrived, in-progress, `Condition`, `Observation` (nadi), finished dengan diagnosis dan cara pulang
- `igd`: `Encounter` arrived, triaged, in-progress, `Condition`, finished
- `ranap`: `Encounter` in-progress di kelas 2, naik kelas ke kelas 1 (pindah ruang), `Condition`, finished

```bash
npm run smoke:sandbox:write            # semua skenario
npm run smoke:sandbox:write -- ranap   # satu skenario: rajal | igd | ranap
npm run smoke:sandbox:write -- all --log=./sandbox-log   # simpan request & response (JSON)
```

Dengan `--log`, setiap request ke SATUSEHAT dan response-nya disimpan per langkah sebagai `NN-<skenario>-<METHOD>-<Resource>.json`. Header (termasuk token) tidak ikut disimpan.

Script ini **membuat data** di sandbox atas nama organisasi di `SATUSEHAT_ORGANIZATION_ID`, dan SATUSEHAT tidak menyediakan DELETE. Data yang dikirim akan terlihat di dashboard log pengiriman SATUSEHAT. Pakai dummy patient dan practitioner sandbox (default), dan jangan arahkan ke production: script menolak berjalan di luar sandbox.

## Documentation

- [Getting Started](./docs/getting-started.md)
- [Authentication](./docs/authentication.md)
- [Errors](./docs/errors.md)
- [AllergyIntolerance](./docs/resources/allergy-intolerance.md)
- [CarePlan](./docs/resources/care-plan.md)
- [ClinicalImpression](./docs/resources/clinical-impression.md)
- [Composition](./docs/resources/composition.md)
- [Condition](./docs/resources/condition.md)
- [DICOM Router](./docs/resources/dicom-router.md)
- [QuestionnaireResponse](./docs/resources/questionnaire-response.md)
- [RiskAssessment](./docs/resources/risk-assessment.md)
- [DiagnosticReport](./docs/resources/diagnostic-report.md)
- [EpisodeOfCare](./docs/resources/episode-of-care.md)
- [FamilyMemberHistory](./docs/resources/family-member-history.md)
- [ImagingStudy](./docs/resources/imaging-study.md)
- [Immunization](./docs/resources/immunization.md)
- [Encounter Builder](./docs/helpers/encounter-builder.md)
- [Encounter Queue Builder](./docs/helpers/encounter-queue-builder.md)
- [Encounter -> Condition Builder](./docs/helpers/encounter-condition-builder.md)
- [Anamnesis Builder](./docs/helpers/anamnesis-builder.md)
- [Physical Exam & Emergency Triage Builder](./docs/helpers/physical-exam-builder.md)
- [Encounter -> Medication Builder](./docs/helpers/encounter-medication-builder.md)
- [Encounter -> MedicationAdministration Builder](./docs/helpers/encounter-medication-administration-builder.md)
- [Encounter -> MedicationRequest Builder](./docs/helpers/encounter-medication-request-builder.md)
- [Encounter -> Procedure Builder](./docs/helpers/encounter-procedure-builder.md)
- [Patient](./docs/resources/patient.md)
- [Encounter](./docs/resources/encounter.md)
- [Procedure](./docs/resources/procedure.md)
- [Observation](./docs/resources/observation.md)
- [MedicationAdministration](./docs/resources/medication-administration.md)
- [NutritionOrder](./docs/resources/nutrition-order.md)
- [Medication](./docs/resources/medication.md)
- [MedicationRequest](./docs/resources/medication-request.md)
- [ServiceRequest](./docs/resources/service-request.md)
- [Specimen](./docs/resources/specimen.md)
- [ServiceRequest -> Specimen -> Observation Builder](./docs/helpers/service-request-specimen-observation-builder.md)
- [ServiceRequest -> ImagingStudy -> DiagnosticReport Builder](./docs/helpers/service-request-imaging-study-diagnostic-report-builder.md)
- [Chest X-Ray Study Builder](./docs/helpers/chest-xray-study-builder.md)
- [Laboratory Panel Builder](./docs/helpers/laboratory-panel-builder.md)
- [CBC Panel Builder](./docs/helpers/cbc-panel-builder.md)
- [Risk Assessment Builder](./docs/helpers/risk-assessment-builder.md)
- [Organization](./docs/resources/organization.md)
- [Location](./docs/resources/location.md)
- [Practitioner](./docs/resources/practitioner.md)
- [PractitionerRole](./docs/resources/practitioner-role.md)
- [Planning](./docs/planning.md)

## DICOM Router

SDK ini juga mendukung download file `docker-compose.yml` untuk DICOM Router SATUSEHAT:

```ts
const dockerCompose = await client.dicomRouter.downloadConfig();
```

Secara default SDK akan memakai endpoint berikut:

- sandbox: `https://api-satusehat-stg.dto.kemkes.go.id/dicom-router`
- production: `https://api-satusehat.kemkes.go.id/dicom-router`

## Buy Us a Coffee

Kalau project ini membantu, kamu bisa dukung Digital Medika lewat Saweria:

- [Buy us a coffee on Saweria](https://saweria.co/digitalmedika)

## Premium Support

Untuk premium support dan implementasi, hubungi:

- Email: [info@digitalmedika.co.id](mailto:info@digitalmedika.co.id)
- WhatsApp: [Digital Medika](https://wa.me/qr/F37IBV5GECN7K1)

![QR WhatsApp Digital Medika](docs/assets/premium-support-whatsapp-qr.jpeg)

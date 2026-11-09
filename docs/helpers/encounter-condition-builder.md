# Encounter -> Condition Builder

## Ringkasan

Helper `createEncounterConditionBuilder` ditujukan untuk alur pasca-`Encounter`, terutama saat `Encounter` IGD sudah berhasil dibuat lalu aplikasi perlu:

- membangun payload `Condition` yang otomatis mewarisi `subject` dan referensi `Encounter`
- menjaga category default sebagai `encounter-diagnosis`
- menyiapkan entry `Encounter.diagnosis` setelah resource `Condition` berhasil dibuat

Helper ini cocok untuk alur sederhana `Encounter -> Condition` sebelum meluas ke resource klinis lain.

Kalau kamu hanya butuh membentuk item `Encounter.diagnosis` dari `conditionId` atau `conditionReference`, gunakan helper ringan `createEncounterDiagnosis(...)` tanpa harus membuat `createEncounterConditionBuilder(...)`.

## Contoh Alur IGD Sederhana

```ts
import {
  createEncounterDiagnosis,
  createEncounterConditionBuilder,
  createEmergencyEncounterHistory,
  createEncounterBuilder,
} from "@digitalmedika/satusehat";

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
  identifier: {
    system: "http://sys-ids.kemkes.go.id/encounter/10000004",
    use: "official",
    value: "IGD-20240001",
  },
  subject: {
    reference: "Patient/100000030009",
    display: "Budi Santoso",
  },
  reasonCode: {
    coding: [
      {
        system: "http://terminology.hl7.org/CodeSystem/encounter-reason",
        code: "29857009",
        display: "Chest pain",
      },
    ],
  },
  diagnosis: {
    condition: {
      reference: "Condition/pre-triage-note",
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
      reference: "Location/igd-observation-bed-02",
      display: "Bed Observasi IGD 02",
    },
    status: "active",
  },
  serviceProvider: {
    reference: "Organization/10000004",
    display: "RS SATUSEHAT",
  },
});

const createdEncounter = await client.encounter.create(encounterDraft.build());

const conditionBuilder = createEncounterConditionBuilder({
  subject: encounterDraft.build().subject,
  encounter: {
    reference: `Encounter/${createdEncounter.id}`,
  },
  condition: {
    code: {
      coding: [
        {
          system: "http://hl7.org/fhir/sid/icd-10",
          code: "R07.4",
          display: "Chest pain, unspecified",
        },
      ],
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
    verificationStatus: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
          code: "provisional",
          display: "Provisional",
        },
      ],
    },
    recorder: {
      reference: "Practitioner/N10000001",
      display: "Dokter Jaga IGD",
    },
  },
}).addNote({
  text: "Diagnosis kerja awal setelah triase.",
});

const condition = await client.condition.create(conditionBuilder.buildCondition());

const diagnosisEntry = createEncounterDiagnosis({
  conditionId: condition.id,
});
```

Kalau aplikasi kamu ingin menulis ulang diagnosis final ke resource `Encounter`, gunakan `diagnosisEntry` di atas sebagai item baru pada field `diagnosis`.

## Method Utama

- `setSubject(reference)`
- `setEncounter(reference)`
- `mergeCondition(partialCondition)`
- `addCategory(codeableConcept)`
- `addNote(note)`
- `buildCondition()`
- `buildEncounterDiagnosis({ conditionId | conditionReference, use?, rank? })`
- `createEncounterDiagnosis({ conditionId | conditionReference, use?, rank? })`

## Catatan

- `buildCondition()` selalu menghasilkan payload `Condition` yang valid terhadap schema SDK.
- Jika category tidak diberikan, helper akan mengisi `encounter-diagnosis` sebagai default.
- `buildEncounterDiagnosis(...)` dan `createEncounterDiagnosis(...)` butuh `conditionId` atau `conditionReference` karena link diagnosis baru aman dibuat setelah resource `Condition` diketahui.

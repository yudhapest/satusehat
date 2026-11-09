# Encounter Queue Builder

## Ringkasan

Helper `createEncounterQueueBuilder` ditujukan untuk flow antrean yang bertahap, terutama saat aplikasi perlu:

- membentuk draft `Encounter` dari nomor registrasi, pasien, dokter, lokasi, dan timeline status
- mengambil payload `Encounter` sesuai checkpoint status seperti `arrived`, `in-progress`, atau `finished`
- menyiapkan payload `Condition` setelah `Encounter` benar-benar berhasil dibuat
- membentuk ulang payload `Encounter` final yang sudah memuat `diagnosis`

Helper ini cocok untuk migrasi dari controller lama yang sebelumnya menyusun payload `Encounter` dan `Condition` secara manual per tahap.

## Contoh Flow Antrean Rawat Jalan

```ts
import { createEncounterQueueBuilder } from "@digitalmedika/satusehat";

const queueFlow = createEncounterQueueBuilder({
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

const encounterArrived = queueFlow.buildEncounterAtStage("arrived");
const createdEncounter = await client.encounter.create(encounterArrived);

const encounterInProgress = queueFlow.buildEncounterAtStage("in-progress");
await client.encounter.update({
  id: createdEncounter.id,
  body: { ...encounterInProgress, id: createdEncounter.id },
});

const condition = await client.condition.create(
  queueFlow.buildCondition(
    createdEncounter.id,
    "Kunjungan LINA,NY pada 2026-04-06",
  ),
);

const encounterFinished = queueFlow.buildEncounterWithDiagnosis({
  conditionId: condition.id,
});

await client.encounter.update({
  id: createdEncounter.id,
  body: { ...encounterFinished, id: createdEncounter.id },
});
```

## Method Utama

- `listEncounterStages()`
- `buildEncounter()`
- `buildEncounterAtStage(status)`
- `buildEncounterWithDiagnosis({ conditionId | conditionReference, use?, rank? })`
- `buildEncounterAtStageWithDiagnosis(status, { conditionId | conditionReference, use?, rank? })`
- `createConditionBuilder(encounterId, encounterDisplay?)`
- `buildCondition(encounterId, encounterDisplay?)`

## Catatan

- `consultationMethod` default adalah `RAJAL`, jadi helper ini langsung cocok untuk antrean rawat jalan.
- `buildEncounterAtStage(...)` akan memotong timeline sampai status yang diminta, lalu menghitung `period` dan `statusHistory` yang relevan untuk checkpoint itu.
- `buildEncounter()` selalu mengambil stage terakhir pada timeline.
- `buildCondition(...)` hanya tersedia jika `condition` diisi saat builder dibuat.
- Helper ini memanfaatkan shortcut yang sudah ada seperti `createEncounterIdentifier(...)`, `createEncounterParticipant(...)`, `createEncounterLocation(...)`, dan `createEncounterDiagnosis(...)`.

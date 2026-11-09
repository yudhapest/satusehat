# Encounter Builder

## Ringkasan

Helper `createEncounterBuilder` mempermudah penyusunan payload `Encounter` secara bertahap, terutama untuk pola yang sering berulang seperti:

- rawat jalan
- rawat inap
- IGD
- kebutuhan custom dengan `Encounter.class` sendiri

Untuk alur IGD/triage yang punya banyak transisi status dan perpindahan class layanan, gunakan `createEmergencyEncounterHistory(...)` supaya `statusHistory` dan `classHistory` terbentuk otomatis dari titik waktu transisi.

Preset yang tersedia:

- `outpatient` -> `AMB`
- `inpatient` -> `IMP`
- `emergency` -> `EMER`

Kalau butuh kasus lain, kamu bisa melewatkan `preset` dan mengirim `encounterClass` secara manual.

`diagnosis` bersifat opsional saat create draft awal. Ini berguna untuk flow di mana `Encounter` perlu dibuat dulu, lalu diagnosis diisi belakangan lewat update atau patch.

Selain builder utama, helper ini sekarang punya shortcut yang cocok untuk flow antrean atau migrasi dari controller lama:

- `createEncounterIdentifier(organizationId, registrationId)`
- `createEncounterServiceProviderReference(organizationId, display?)`
- `createEncounterParticipant({ practitionerId, display, ... })`
- `createEncounterLocation({ locationId, display, ... })`
- `createEncounterClassFromConsultationMethod("RAJAL" | "IGD" | "RANAP" | "HOMECARE" | "TELEKONSULTASI")`
- `createEncounterStatusTimeline({ stages, periodEnd })`

## Contoh Dasar

```ts
import { createEncounterBuilder } from "@digitalmedika/satusehat";

const encounter = createEncounterBuilder({
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
      reference: "Location/poli-anak",
      display: "Poliklinik Anak",
    },
    status: "active",
  },
  serviceProvider: {
    reference: "Organization/10000004",
  },
})
  .addParticipant({
    individual: {
      reference: "Practitioner/N10000001",
      display: "Dokter Bronsig",
    },
  })
  .build();
```

## Contoh Rawat Inap

```ts
const encounter = createEncounterBuilder({
  preset: "inpatient",
  identifier: {
    system: "http://sys-ids.kemkes.go.id/encounter/10000004",
    use: "official",
    value: "RI-20240001",
  },
  status: "in-progress",
  subject: {
    reference: "Patient/100000030009",
  },
  period: {
    start: "2024-04-01T01:00:00+00:00",
    end: "2024-04-03T08:00:00+00:00",
  },
  reasonCode: {
    coding: [
      {
        system: "http://terminology.hl7.org/CodeSystem/encounter-reason",
        code: "32485007",
        display: "Hospital admission",
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
      reference: "Location/bed-rawat-inap-a",
      display: "Bangsal Mawar Bed A",
    },
    status: "active",
  },
  serviceProvider: {
    reference: "Organization/10000004",
  },
})
  .setHospitalization({
    admitSource: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/admit-source",
          code: "hosp-trans",
          display: "Transferred from other hospital",
        },
      ],
    },
  })
  .build();
```

## Contoh Alur IGD/Triage

```ts
import {
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
  classStages: [
    {
      start: "2024-04-03T01:00:00+00:00",
      preset: "emergency",
    },
    {
      start: "2024-04-03T03:00:00+00:00",
      preset: "inpatient",
    },
  ],
  periodEnd: "2024-04-05T05:00:00+00:00",
});

const encounter = createEncounterBuilder({
  ...emergencyFlow,
  identifier: {
    system: "http://sys-ids.kemkes.go.id/encounter/10000004",
    use: "official",
    value: "IGD-20240001",
  },
  subject: {
    reference: "Patient/100000030009",
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
      reference: "Location/igd-observation-bed-02",
      display: "Bed Observasi IGD 02",
    },
    status: "active",
  },
  serviceProvider: {
    reference: "Organization/10000004",
  },
}).build();
```

Aturan helper ini:

- status pertama harus `arrived`
- setiap `start` harus urut naik
- `periodEnd` otomatis menjadi akhir status dan class terakhir
- kalau `classStages` tidak diberikan, helper akan membuat 1 class `emergency` untuk seluruh encounter

## Method Utama

- `setPreset(preset)`
- `setConsultationMethod(method)`
- `setClass(classCoding)`
- `setStatus(status)`
- `setSubject(reference)`
- `setPeriod(period)`
- `setServiceType(codeableConcept)`
- `setPriority(codeableConcept)`
- `setHospitalization(hospitalization)`
- `setLength(quantity)`
- `setServiceProvider(reference)`
- `addIdentifier(identifier)`
- `addParticipant(participant)`
- `addReasonCode(reasonCode)`
- `addReasonReference(reference)`
- `addDiagnosis(diagnosis)`
- `addDiagnosisByCondition(conditionId, options?)`
- `addLocation(location)`
- `addStatusHistory(statusHistory)`
- `addClassHistory(classHistory)`
- `addEpisodeOfCare(reference)`
- `addBasedOn(reference)`
- `addAccount(reference)`
- `addType(type)`
- `merge(partial)`
- `build()`

## Catatan

- Constructor otomatis mengisi `statusHistory` dan `classHistory` default dari `status`, `period`, dan preset atau `encounterClass` yang dipilih.
- `setPreset(...)` hanya mengubah `class` saat ini. Kalau kamu juga ingin menyesuaikan histori class, tambahkan atau ganti `classHistory` secara eksplisit.
- `setConsultationMethod(...)` adalah shortcut untuk mengubah `class` dari istilah operasional seperti `RAJAL`, `IGD`, atau `RANAP`. Sama seperti `setPreset(...)`, method ini tidak mengubah `classHistory`.
- `createEmergencyEncounterHistory(...)` mengembalikan `status`, `period`, `encounterClass`, `statusHistory`, dan `classHistory` sehingga bisa langsung di-spread ke `createEncounterBuilder(...)`.
- `createEncounterStatusTimeline(...)` cocok untuk alur status berurutan yang tidak butuh helper class history seperti `createEmergencyEncounterHistory(...)`.
- `build()` selalu memvalidasi draft akhir dengan `EncounterCreateSchema`.
- Kalau `diagnosis` belum tersedia saat create awal, kamu bisa melewatkannya dulu lalu menambahkan lewat `addDiagnosis(...)`, `merge(...)`, atau update resource setelah `Condition` berhasil dibuat.

## Contoh Shortcut Antrean

```ts
import {
  createEncounterBuilder,
  createEncounterIdentifier,
  createEncounterLocation,
  createEncounterParticipant,
  createEncounterServiceProviderReference,
  createEncounterStatusTimeline,
} from "@digitalmedika/satusehat";

const timeline = createEncounterStatusTimeline({
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
});

const encounter = createEncounterBuilder({
  preset: "outpatient",
  identifier: createEncounterIdentifier("100025939", "ANTRI-88537"),
  ...timeline,
  subject: {
    reference: "Patient/P02361976250",
    display: "LINA,NY",
  },
  location: createEncounterLocation({
    locationId: "2148a1a7-925d-4543-ac63-2e9bf53e5c68",
    display: "FISIO TERAPI",
    status: "active",
  }),
  serviceProvider: createEncounterServiceProviderReference(
    "100025939",
    "RS SATUSEHAT",
  ),
})
  .addParticipant(
    createEncounterParticipant({
      practitionerId: "10006330933",
      display: "dr. Asih Aprilya, Sp. KFR, M.Ked.Klin",
      typeText: "Dokter penanggung jawab pelayanan",
    }),
  )
  .addDiagnosisByCondition("cond-final-1", {
    display: "Primary gonarthrosis bilateral",
  })
  .build();
```

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
- `createEncounterLocation({ locationId, display, serviceClass, ... })`
- `createEncounterClassFromConsultationMethod("RAJAL" | "IGD" | "RANAP" | "HOMECARE" | "TELEKONSULTASI")` (`HOMECARE` = `HH`, `TELEKONSULTASI` = `VR` / virtual)
- `createEncounterStatusTimeline({ stages, periodEnd? })`
- `createEncounterLocationServiceClassExtension({ careSetting, serviceClass, upgradeClass? })`
- `createEncounterDischargeDisposition(code, text?)`
- `createEncounterAdmitSource(code, text?)`
- `createEncounterDiagnosisUse(code)`
- `createEncounterNoveltyExtension(kind, code)`
- `createEncounterClass(code)`
- `moveEncounterLocation(locations, next, at)`

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
- `periodEnd` otomatis menjadi akhir status dan class terakhir. Kosongkan `periodEnd` selama pasien masih di IGD, sehingga status terakhir tetap terbuka
- kalau `classStages` tidak diberikan, helper akan membuat 1 class `emergency` untuk seluruh encounter

## Rawat Jalan, IGD, dan Rawat Inap (Alur Real-Time)

Di SIMRS, waktu setiap tahap baru diketahui saat terjadi. Pakai `advanceStatus`, `moveToLocation`, dan `finish` pada builder yang sama, lalu kirim hasil `build()` dengan `create` (POST) atau `update` (PUT).

Semua kode resmi Encounter (Lampiran Standar Terminologi SATUSEHAT v12.0, 31 Oktober 2026, bab 3) ada di satu file, `src/schemas/encounter-terminology.ts`, dan di-export dari package: `ENCOUNTER_CLASSES`, `ENCOUNTER_OUTPATIENT_SERVICE_CLASSES`, `ENCOUNTER_INPATIENT_SERVICE_CLASSES`, `ENCOUNTER_UPGRADE_CLASSES`, `ENCOUNTER_ADMIT_SOURCES`, `ENCOUNTER_DISCHARGE_DISPOSITIONS`, `ENCOUNTER_DIAGNOSIS_USES`, `ENCOUNTER_NOVELTY_CODES`. Saat Kemenkes merilis versi baru, cukup perbarui file ini.

### Kelas perawatan dan indikator perubahan kelas

`Encounter.location` membawa extension SATUSEHAT `ServiceClass` (`https://fhir.kemkes.go.id/r4/StructureDefinition/ServiceClass`) dengan dua isi: kelas perawatan (`value`) dan indikator perubahan kelas (`upgradeClassIndicator`). Isi lewat opsi `serviceClass` di `createEncounterLocation`:

| `careSetting` | Dipakai untuk | `serviceClass` |
|---|---|---|
| `outpatient` | Rawat jalan dan IGD | `reguler` (Kelas Reguler), `eksekutif` (Kelas Eksekutif) |
| `inpatient` | Rawat inap | `1`, `2`, `3`, `vip`, `vvip`, `kris-a`, `kris-b`, `kris-c` (KRIS) |

`upgradeClass`: `kelas-tetap` (default), `naik-kelas`, `turun-kelas`, `titip-rawat`.

Saat dikirim, kelas harus cocok dengan jenis kunjungan: Encounter `AMB` dan `EMER` memakai kelas rawat jalan, sedangkan `IMP` memakai kelas rawat inap atau KRIS. Kombinasi yang tidak cocok ditolak sebelum request dikirim.

### Elemen wajib per layanan

`client.encounter.create` dan `update` menolak Encounter yang belum memuat elemen bertanda wajib (*) di tabel Pendaftaran Kunjungan tiap panduan. Aturannya berbeda per `class`:

| Elemen | Rawat Jalan (`AMB`) | IGD (`EMER`) | Rawat Inap (`IMP`) |
|---|---|---|---|
| `participant[i].type` | wajib | wajib | – |
| `participant[i].individual` | wajib | – | wajib |
| `location` ServiceClass | – | wajib, hanya `reguler` | – |
| `diagnosis` (saat `finished`) | wajib | wajib | wajib |
| `hospitalization.dischargeDisposition` (saat `finished`) | wajib | wajib | – |

Draft dari builder (`build()`) tidak dicek untuk elemen ini, sehingga Encounter bisa dirakit bertahap.

### Tipe pelayanan (`serviceType`)

`serviceType` berisi satu kode dari HL7 `service-type`, SNOMED CT, atau Kemenkes. Daftar resmi ada di [lampiran Encounter.serviceType](https://docs.google.com/spreadsheets/d/1t6czuuLW38WUpZS62OeBf9wImSIicDqci7zXMRJibfg): tab `Encounter.serviceType` (kode FHIR) dan tab RL 3.2, RL 3.5, RL 3.10 (pemetaan Jenis Kegiatan SIRS Online). Pemetaan poli ke kode adalah konfigurasi SIMRS, karena tiap laporan RL bisa memakai kode berbeda untuk poli yang sama.

```ts
import { HL7_SERVICE_TYPE_SYSTEM, SNOMED_CT_SYSTEM } from "@digitalmedika/satusehat";

// Poli Umum (RL 3.5)
const umum = { coding: [{ system: HL7_SERVICE_TYPE_SYSTEM, code: "124", display: "General Practice" }] };
// Penyakit Dalam rawat inap (RL 3.2)
const penyakitDalam = {
  coding: [{ system: SNOMED_CT_SYSTEM, code: "792848000", display: "Internal medicine service" }],
};

createEncounterBuilder({ /* ... */ serviceType: umum });
```

### Rawat jalan

```ts
const builder = createEncounterBuilder({
  preset: "outpatient",
  identifier: createEncounterIdentifier(organizationId, noRegistrasi),
  status: "arrived",
  period: { start: waktuDatang },
  subject: { reference: `Patient/${ihsPasien}` },
  participant: [createEncounterParticipant({ practitionerId: ihsDokter })],
  location: createEncounterLocation({
    locationId: idPoli,
    status: "active",
    period: { start: waktuDatang },
    serviceClass: { careSetting: "outpatient", serviceClass: "reguler" },
  }),
  serviceProvider: createEncounterServiceProviderReference(organizationId),
});

const created = await client.encounter.create(builder.build());

// Pasien mulai diperiksa dokter
builder.advanceStatus("in-progress", waktuDiperiksa);
await client.encounter.update({ id: created.id, body: { ...builder.build(), id: created.id } });

// Selesai: diagnosis dan cara pulang
builder
  .addDiagnosisByCondition(condition.id)
  .setInpatientHospitalization({ dischargeDisposition: "home" })
  .finish(waktuPulang);
await client.encounter.update({ id: created.id, body: { ...builder.build(), id: created.id } });
```

### IGD

Sama seperti rawat jalan dengan `preset: "emergency"` (`EMER`), kelas `outpatient`/`reguler`, dan tahap triase:

```ts
builder.advanceStatus("triaged", waktuTriase);
builder.advanceStatus("in-progress", waktuDitangani);
```

### Rawat inap dan naik kelas

Pasien rawat inap dikirim dengan status `in-progress` tanpa `period.end`. Saat pindah ruang atau naik kelas, `moveToLocation` menutup lokasi lama (`status: "completed"`, `period.end`) dan menambahkan lokasi baru:

```ts
const builder = createEncounterBuilder({
  preset: "inpatient",
  // identifier, subject, participant, serviceProvider seperti di atas
  status: "in-progress",
  period: { start: waktuMasuk },
  location: createEncounterLocation({
    locationId: idBedKelas2,
    status: "active",
    period: { start: waktuMasuk },
    serviceClass: { careSetting: "inpatient", serviceClass: "2" },
  }),
});

// Naik kelas 2 -> 1
builder.moveToLocation(
  {
    locationId: idBedKelas1,
    serviceClass: { careSetting: "inpatient", serviceClass: "1", upgradeClass: "naik-kelas" },
  },
  waktuPindah,
);
```

### Asal masuk (`admitSource`)

`createEncounterAdmitSource(code, text?)` atau `setInpatientHospitalization({ admitSource: code })`. Kode resmi (`ENCOUNTER_ADMIT_SOURCES`): `hosp-trans`, `emd` (dari IGD), `outp` (dari rawat jalan), `born`, `gp`, `mp`, `nursing`, `psych`, `rehab`, `other`, `TK000031` (Rujukan Poli), `EHA000001` (Kader/Komunitas), `TK000033` (LSM), `225323000`, `TK000070` (Posyandu), `1991000124105` (datang sendiri). CodeSystem diisi otomatis.

### Cara pulang (`dischargeDisposition`)

`createEncounterDischargeDisposition(code, text?)` atau `setInpatientHospitalization({ dischargeDisposition: code })`. Kode yang dipakai panduan Rawat Jalan, IGD, dan Rawat Inap:

| Kode | Arti | CodeSystem |
|---|---|---|
| `home` | Pulang atas persetujuan dokter | HL7 |
| `aadvice` | Pulang paksa / atas permintaan sendiri | HL7 |
| `other-hcf` | Dirujuk | HL7 |
| `oth` | Lain-lain (isi `text`) | HL7 |
| `exp-lt48h` | Meninggal < 48 jam | Kemenkes |
| `exp-gt48h` | Meninggal > 48 jam | Kemenkes |

Kode lain di `ENCOUNTER_DISCHARGE_DISPOSITIONS`: `alt-home`, `hosp`, `long`, `exp`, `psy`, `rehab`, `snf`, `416462003` (SNOMED), `TK000323` (False emergency).

### Peran diagnosis (`diagnosis.use`)

Default `AD` (Admission diagnosis). Pakai `createEncounterDiagnosisUse(code)` untuk `DD` (Discharge diagnosis), `CC` (Chief complaint), `CM`, `pre-op`, `post-op`, atau `billing`:

```ts
builder.addDiagnosisByCondition(condition.id, { use: createEncounterDiagnosisUse("DD") });
```

### Riwayat DPJP (`participant.period`)

Isi `period` pada `participant` untuk pergantian dokter penanggung jawab. `finish(at)` menutup periode participant yang masih terbuka.

### Status Pengunjung (SIRS Online)

Status Pengunjung (`facility`), Status Kunjungan Spesialisasi (`specialty`), dan Status Episode Pelayanan (`episode`) diisi dengan `new`, `returning`, atau `unknown` (CodeSystem `http://terminology.kemkes.go.id/CodeSystem/encounter-novelty`, Standar Terminologi v12.0 bagian 3.22-3.24):

```ts
builder.setNovelty({ facility: "returning", specialty: "new", episode: "new" });
```

> **Perhatian:** Kemenkes belum mempublikasikan URL extension ini di dokumentasi maupun Implementation Guide. SDK memakai `https://fhir.kemkes.go.id/r4/StructureDefinition/EncounterToFacility` (serta `EncounterToSpecialty` dan `EncounterToEpisode`), mengikuti pola extension resmi lain seperti `ServiceClass`. SATUSEHAT tidak menolak URL extension yang salah, jadi konfirmasikan URL ini ke tim SATUSEHAT (atau koleksi Postman resmi) sebelum dipakai untuk pelaporan. Bila berbeda, cukup ubah `ENCOUNTER_NOVELTY_EXTENSION_URLS` di `src/schemas/encounter-terminology.ts`.

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
- `setLocationServiceClass(locationIndex, serviceClass)`
- `setInpatientHospitalization(hospitalization)`
- `advanceStatus(status, at)`
- `moveToLocation(location, at)`
- `finish(at)`
- `setNovelty({ facility?, specialty?, episode? })`
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
- `period.end` boleh kosong selama kunjungan masih berjalan (misalnya rawat inap). Encounter dengan status `finished` wajib menutup `period.end` dan seluruh periode `statusHistory` serta `classHistory`; aturan ini juga berlaku untuk `client.encounter.update(...)`.
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

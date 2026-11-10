# Anamnesis Builder

## Ringkasan

`createAnamnesisBuilder` menyusun payload **Pengiriman Data Anamnesis** sesuai panduan SATUSEHAT Rawat Jalan, IGD, dan Rawat Inap. Ketiga panduan memakai pemetaan yang sama:

| Sub-item | Resource | Method | Penanda |
|---|---|---|---|
| Keluhan Utama | `Condition` | `buildChiefComplaint` | category `chief-complaint` (Kemenkes) |
| Keluhan Penyerta | `Condition` | `buildAccompanyingComplaint` | category `problem-list-item` (HL7) |
| Riwayat Penyakit Pribadi | `Condition` | `buildPersonalHistory` | category `previous-condition` (Kemenkes), `clinicalStatus` active/inactive |
| Riwayat Penyakit Keluarga | `FamilyMemberHistory` | `buildFamilyHistory` | relationship `FAMMEMB` |
| Riwayat Alergi | `AllergyIntolerance` | `buildAllergy` | category, clinicalStatus, reaction |
| Riwayat Pengobatan | `MedicationStatement` | `buildMedicationHistory` | obat KFA atau Medication dari faskes |

Keluhan utama juga ditautkan ke kunjungan lewat `Encounter.diagnosis` dengan use `CC` (`buildChiefComplaintDiagnosis`). Panduan mewajibkan ini saat Encounter di-PUT dengan status `finished`.

Builder hanya menyusun dan memvalidasi payload. Kirim hasilnya dengan client yang sesuai.

## Contoh Alur

```ts
import { createAnamnesisBuilder } from "@digitalmedika/satusehat";

const anamnesis = createAnamnesisBuilder({
  subject: { reference: `Patient/${ihsPasien}` },
  encounter: { reference: `Encounter/${encounterId}` },
  recorder: { reference: `Practitioner/${ihsDokter}` }, // wajib untuk riwayat alergi
  recordedDate: waktuAnamnesis,
});

// 1. Keluhan utama (SNOMED CT << 404684003 Clinical finding)
const keluhanUtama = await client.condition.create(
  anamnesis.buildChiefComplaint({
    code: { code: "49727002", display: "Cough" },
    onsetDateTime: "2026-11-08T01:00:00+00:00",
  }),
);

// 2. Keluhan penyerta
await client.condition.create(
  anamnesis.buildAccompanyingComplaint({ code: { code: "25064002", display: "Headache" } }),
);

// 3. Riwayat penyakit pribadi (<< 417662000 History of clinical finding, atau << 443508001)
await client.condition.create(
  anamnesis.buildPersonalHistory({
    code: { code: "161501007", display: "History of hypertension" },
    clinicalStatus: "active", // "inactive" bila sudah tidak berlangsung
  }),
);

// 4. Riwayat penyakit keluarga (<< 416471007 Family history of clinical finding)
await client.familyMemberHistory.create(
  anamnesis.buildFamilyHistory({
    conditions: [{ code: { code: "160303001", display: "FH: Diabetes mellitus" } }],
  }),
);

// 5. Riwayat alergi
await client.allergyIntolerance.create(
  anamnesis.buildAllergy({
    category: ["food"],
    code: { code: "227493005", display: "Cashew nuts" },
    verificationStatus: "confirmed",
    reaction: [{ manifestation: ["126485001"], severity: "mild" }], // 126485001 = Urticaria
  }),
);

// 6. Riwayat pengobatan
await client.medicationStatement.create(
  anamnesis.buildMedicationHistory({
    medication: { kfa: { code: "92001087", display: "Ampicillin Trihydrate 500 mg Tablet" } },
    status: "completed",
    category: "community",
  }),
);

// Saat kunjungan selesai: tautkan keluhan utama ke Encounter (use CC)
encounterBuilder.addDiagnosis(anamnesis.buildChiefComplaintDiagnosis(keluhanUtama.id, 2));
```

## Kode dan Aturan

- **Kode klinis** (`code`) default memakai SNOMED CT. Isi `system` untuk sistem lain, misalnya KFA atau ATC pada alergi obat.
- **Riwayat Alergi**: SATUSEHAT mewajibkan `category`, `code`, `patient`, `encounter`, dan `recorder`. Builder mengisi `patient`, `encounter`, dan `recorder` dari konteks, dan `client.allergyIntolerance.create` menolak payload tanpa ketiganya sebelum dikirim. Kode alergen: KFA (obat/vaksin), WHO ATC level 3/4 (golongan obat), atau SNOMED CT (makanan, lingkungan, termasuk `716186003` No known allergy). Manifestasi reaksi resmi ada di `ALLERGY_INTOLERANCE_REACTION_MANIFESTATIONS`.
- **Riwayat Pengobatan**:
  - Obat dari luar faskes: `medication: { kfa: { code, display } }`, dengan KFA `93xxxxxx` bila merek diketahui atau `92xxxxxx` bila hanya generik.
  - Obat dari faskes yang sama: `medication: { reference: "Medication/{id}" }` (hasil GET MedicationDispense pasien), atau `{ reference: "#id", contained: [medication] }`.
  - `context` otomatis diisi Encounter (wajib di panduan IGD).
- **Status MedicationStatement**: `active`, `completed`, `entered-in-error`, `intended`, `stopped`, `on-hold`, `unknown`, `not-taken`.

## Perilaku Server SATUSEHAT (hasil uji sandbox, November 2026)

- **Riwayat penyakit keluarga melekat ke pasien.** SATUSEHAT menolak `FamilyMemberHistory` yang sama untuk pasien yang sama (RuleNumber 20002, "Found duplicate"). Kirim sekali per pasien: cari dulu dengan `client.familyMemberHistory.search({ patient })`, lalu `update` bila perlu diubah.
- **Manifestasi reaksi alergi.** Lampiran Standar Terminologi v12.0 (4.8) memakai kode SNOMED CT, tetapi sandbox saat ini menolak semua sistem kode pada `reaction.manifestation` (RuleNumber 11149) dan hanya menerima teks. Sementara itu kirim manifestasi sebagai teks: `reaction: [{ manifestation: [{ text: "Urticaria (gatal-gatal)" }] }]`. Kode resmi tetap didukung builder (`manifestation: ["126485001"]`) untuk dipakai begitu SATUSEHAT memperbaiki validasinya; laporkan isu ini ke helpdesk SATUSEHAT.

Semua kode resmi tersedia sebagai konstanta: `CONDITION_CATEGORIES`, `CONDITION_CLINICAL_STATUSES`, `CONDITION_VERIFICATION_STATUSES`, `ALLERGY_INTOLERANCE_CLINICAL_STATUSES`, `ALLERGY_INTOLERANCE_VERIFICATION_STATUSES`, `ALLERGY_INTOLERANCE_REACTION_MANIFESTATIONS`, `MEDICATION_STATEMENT_CATEGORIES`, `FAMILY_MEMBER_RELATIONSHIPS`, `FAMILY_MEMBER_HISTORY_CONDITIONS`, `KFA_SYSTEM`, `SNOMED_CT_SYSTEM`.

Sumber: panduan Rawat Jalan (v7.0), IGD (v5.2), dan Rawat Inap (v6.0) bab Pengiriman Data Anamnesis, serta Lampiran Standar Terminologi SATUSEHAT v12.0 (bab 4, 10, 20, 29).

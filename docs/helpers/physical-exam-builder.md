# Physical Exam & Emergency Triage Builder

## Ringkasan

Dua builder untuk resource `Observation` sesuai panduan SATUSEHAT:

- `createPhysicalExamBuilder` — **Pengiriman Data Hasil Pemeriksaan Fisik**. Pemetaannya sama untuk Rawat Jalan (v7.0), Rawat Inap (v6.0), dan bagian pemeriksaan fisik Asesmen Awal IGD (v5.2): tanda vital, antropometri, tingkat kesadaran, dan pemeriksaan head to toe.
- `createEmergencyTriageBuilder` — **Pengiriman Data Triase dan Gawat Darurat** (khusus IGD): sarana transportasi kedatangan, surat pengantar rujukan, dan kondisi pasien tiba (CTAS).

Satu item = satu `Observation` (tekanan darah dikirim sebagai dua Observation: sistole dan diastole). Builder mengisi `status: "final"`, category, kode LOINC/SNOMED CT, satuan UCUM, `subject`, `encounter`, `performer`, `effectiveDateTime`, dan `issued`. Kirim setiap hasil dengan `client.observation.create`.

`Observation.performer` wajib menurut panduan; `client.observation.create` dan `update` menolak Observation tanpa performer sebelum dikirim.

## Konteks

```ts
import { createEmergencyTriageBuilder, createPhysicalExamBuilder } from "@digitalmedika/satusehat";

const context = {
  subject: { reference: `Patient/${ihsPasien}` },
  encounter: { reference: `Encounter/${encounterId}` },
  performer: { reference: `Practitioner/${ihsPemeriksa}` }, // wajib
  effectiveDateTime: waktuPemeriksaan, // UTC, misalnya "2026-11-10T01:00:00+00:00"
  // issued: waktuDicatat (default = effectiveDateTime)
};
```

## Tanda Vital dan Antropometri

```ts
const exam = createPhysicalExamBuilder(context);

const observations = exam.buildMeasurements({
  "denyut-jantung": 80,
  pernapasan: 20,
  sistole: 120,
  diastole: 80,
  "suhu-tubuh": 36.8,
  "tinggi-badan": 165,
  "berat-badan": 60,
  "luas-permukaan-tubuh": undefined, // dilewati bila tidak diukur
});

for (const observation of observations) {
  await client.observation.create(observation);
}
```

| Kunci | LOINC | Display | Satuan (unit / UCUM) |
|---|---|---|---|
| `denyut-jantung` | 8867-4 | Heart rate | beats/min / `/min` |
| `pernapasan` | 9279-1 | Respiratory rate | breaths/min / `/min` |
| `sistole` | 8480-6 | Systolic blood pressure | mm[Hg] / `mm[Hg]` |
| `diastole` | 8462-4 | Diastolic blood pressure | mm[Hg] / `mm[Hg]` |
| `suhu-tubuh` | 8310-5 | Body temperature | C / `Cel` |
| `tinggi-badan` | 8302-2 | Body height | cm / `cm` |
| `berat-badan` | 29463-7 | Body weight | kg / `kg` |
| `luas-permukaan-tubuh` | 8277-6 | Body surface area (anak) | m2 / `m2` |

Satu item: `exam.buildMeasurement("denyut-jantung", 80)`.

## Tingkat Kesadaran

```ts
await client.observation.create(exam.buildConsciousness("248234008"));
```

LOINC 67775-7 (Level of responsiveness), category `exam`, nilai SNOMED CT: `248234008` Mentally alert, `300202002` Response to voice, `450847001` Responds to pain, `422768004` Unresponsive, `130987000` Acute confusion, `2776000` Delirium.

## Pemeriksaan Fisik Head to Toe

```ts
const findings = exam.buildHeadToToeExams({
  kepala: "Normocephal, tidak ada lesi",
  mata: "Konjungtiva tidak anemis, sklera tidak ikterik",
  tonsil: "T1-T1, tidak hiperemis",
  perut: "Supel, bising usus normal",
});
```

Category `exam`, kode LOINC narrative, nilai `valueString`. Item yang dilewati atau kosong tidak dikirim. Kunci yang tersedia (`OBSERVATION_HEAD_TO_TOE_EXAMS`): `kepala`, `mata`, `telinga`, `hidung`, `rambut`, `bibir`, `gigi-geligi`, `lidah`, `langit-langit`, `leher`, `tenggorokan`, `tonsil`, `dada`, `payudara`, `punggung`, `perut`, `genital`, `anus-dubur`, `lengan-atas`, `lengan-bawah`, `jari-tangan`, `kuku-tangan`, `persendian-tangan`, `tungkai-atas`, `tungkai-bawah`, `jari-kaki`, `kuku-kaki`, `persendian-kaki`.

Panduan memakai kode LOINC yang sama untuk beberapa bagian (misalnya `langit-langit` dan `tonsil` = 10201-2, `kuku-tangan` dan `kuku-kaki` = 32456-6) dan membedakannya dengan `Observation.bodySite` SNOMED CT. Builder mengisi bodySite tersebut otomatis.

## Triase IGD

```ts
const triage = createEmergencyTriageBuilder(context);

await client.observation.create(triage.buildArrivalTransport("ambulans"));
await client.observation.create(triage.buildReferralLetter(true));
await client.observation.create(triage.buildTriageLevel("emergensi"));
```

- Sarana transportasi (LOINC 74286-6): `ambulans`, `mobil`, `motor`, `lain-lain` (isi teks: `buildArrivalTransport("lain-lain", "Diantar ojek online")`).
- Surat pengantar rujukan (`OC000034`, Kemenkes clinical-term): `valueBoolean`.
- Kondisi pasien tiba / CTAS (LOINC 75910-0): `resusitasi` (1), `emergensi` (2), `urgent` (3), `less-urgent` (4), `non-urgent` (5), `death-on-arrival`.

Kirim triase bersama perubahan status Encounter ke `triaged` (`encounterBuilder.advanceStatus("triaged", waktu)`).

## Belum Dicakup

Bagian Observation lain di panduan IGD dan Rawat Inap belum punya builder khusus dan dapat dikirim langsung dengan `client.observation.create`: asesmen nyeri dan skala nyeri, kajian risiko jatuh (Morse, Humpty Dumpty, Edmonson), skrining, dan pemeriksaan fungsional.

Sumber: panduan Rawat Jalan, Rawat Inap, dan IGD (Bab Pemeriksaan Fisik, Asesmen Awal IGD, Triase dan Gawat Darurat), serta Lampiran Standar Terminologi SATUSEHAT v12.0 bab 5.

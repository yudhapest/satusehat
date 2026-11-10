# Encounter -> MedicationAdministration Builder

## Ringkasan

Helper `createEncounterMedicationAdministrationBuilder` ditujukan untuk alur pasca-`Encounter`, terutama saat `Encounter` IGD sudah berhasil dibuat lalu aplikasi perlu:

- membangun payload `MedicationAdministration` yang otomatis mewarisi `subject` pasien dan referensi `Encounter` sebagai `context`
- menjaga pilihan field `medicationCodeableConcept` versus `medicationReference` tetap saling eksklusif
- menjaga pilihan field `effectiveDateTime` versus `effectivePeriod` tetap konsisten selama draft disusun
- menambahkan detail pemberian obat seperti `performer`, `request`, `supportingInformation`, `dosage`, dan catatan klinis tanpa menyusun object mentah berulang kali

Helper ini cocok untuk workflow sederhana `Encounter -> MedicationAdministration`, misalnya rekam pemberian obat oral, injeksi, atau terapi awal lain setelah triase dan asesmen awal di IGD selesai.

## Contoh Alur IGD Sederhana

```ts
import {
  createEmergencyEncounterHistory,
  createEncounterBuilder,
  createEncounterMedicationAdministrationBuilder,
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

const medicationAdministrationBuilder = createEncounterMedicationAdministrationBuilder({
  subject: encounterDraft.build().subject,
  encounter: {
    reference: `Encounter/${createdEncounter.id}`,
  },
  medicationAdministration: {
    status: "completed",
    medicationReference: {
      reference: "Medication/8f299a19-5887-4b8e-90a2-c2c15ecbe1d1",
      display: "Paracetamol 500 mg tablet",
    },
    effectiveDateTime: "2024-04-03T01:40:00+00:00",
    reasonCode: encounterDraft.build().reasonCode,
  },
})
  .setRequest({
    reference: "MedicationRequest/cf92db3e-a044-4e15-83fb-b7ec3a30ba76",
  })
  .addPerformer({
    actor: {
      reference: "Practitioner/N10000001",
      display: "Perawat Jaga IGD",
    },
  })
  .setDosage({
    text: "Berikan 1 tablet sesudah makan.",
    route: {
      coding: [
        {
          system: "http://www.whocc.no/atc",
          code: "O",
          display: "Oral use",
        },
      ],
    },
    dose: {
      value: 1,
      unit: "TAB",
      system: "http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm",
      code: "TAB",
    },
  })
  .addNote({
    text: "Parasetamol oral diberikan setelah dokter IGD menyelesaikan asesmen awal.",
  });

const medicationAdministration = await client.medicationAdministration.create(
  medicationAdministrationBuilder.buildMedicationAdministration(),
);
```

## Method Utama

- `setSubject(reference)`
- `setEncounter(reference)`
- `mergeMedicationAdministration(partialMedicationAdministration)`
- `addIdentifier(identifier)`
- `addInstantiates(uri)`
- `addPartOf(reference)`
- `addStatusReason(codeableConcept)`
- `setCategory(codeableConcept)`
- `setMedicationCodeableConcept(codeableConcept)`
- `setMedicationReference(reference)`
- `addSupportingInformation(reference)`
- `setEffectiveDateTime(dateTime)`
- `setEffectivePeriod(period)`
- `clearEffective()`
- `addPerformer(performer)`
- `addReasonCode(codeableConcept)`
- `addReasonReference(reference)`
- `setRequest(reference)`
- `addDevice(reference)`
- `addNote(note)`
- `setDosage(dosage)`
- `addEventHistory(reference)`
- `setStatus(status)`
- `buildMedicationAdministration()`

## Catatan

- `buildMedicationAdministration()` selalu menghasilkan payload `MedicationAdministration` yang valid terhadap schema SDK.
- `setMedicationCodeableConcept(...)` dan `setMedicationReference(...)` saling menimpa agar draft helper tetap memakai satu representasi obat yang jelas.
- `setEffectiveDateTime(...)` dan `setEffectivePeriod(...)` juga saling menimpa agar waktu pemberian obat tidak ambigu.
- Helper ini tidak melakukan create ke API secara otomatis; gunakan hasil `buildMedicationAdministration()` bersama `client.medicationAdministration.create(...)`.

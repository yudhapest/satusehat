# Encounter -> MedicationRequest Builder

## Ringkasan

Helper `createEncounterMedicationRequestBuilder` ditujukan untuk alur pasca-`Encounter`, terutama saat `Encounter` IGD atau rawat jalan sudah berhasil dibuat lalu aplikasi perlu:

- membangun payload `MedicationRequest` yang otomatis mewarisi `subject` pasien dan referensi `Encounter`
- menyusun resep atau order obat tanpa menulis object mentah berulang kali untuk field seperti `requester`, `reasonCode`, `dosageInstruction`, `dispenseRequest`, dan `substitution`
- menjaga perubahan draft tetap konsisten saat subject, encounter, status, intent, atau medication direvisi selama workflow klinis berjalan

Helper ini cocok untuk workflow sederhana `Encounter -> MedicationRequest`, misalnya saat dokter IGD memutuskan terapi pulang, resep rawat jalan, atau order obat lanjutan setelah asesmen dan tindakan awal selesai.

## Contoh Alur IGD Sederhana

```ts
import {
  createEmergencyEncounterHistory,
  createEncounterBuilder,
  createEncounterMedicationRequestBuilder,
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

const medicationRequestBuilder = createEncounterMedicationRequestBuilder({
  subject: encounterDraft.build().subject,
  encounter: {
    reference: `Encounter/${createdEncounter.id}`,
  },
  medicationRequest: {
    status: "active",
    intent: "order",
    medicationReference: {
      reference: "Medication/8f299a19-5887-4b8e-90a2-c2c15ecbe1d1",
      display: "Amoxicillin 500 mg capsule",
    },
    authoredOn: "2024-04-03T02:10:00+00:00",
    reasonCode: encounterDraft.build().reasonCode,
  },
})
  .setRequester({
    reference: "Practitioner/N10000001",
    display: "Dokter Jaga IGD",
  })
  .addDosageInstruction({
    sequence: 1,
    text: "Minum 1 kapsul 3 kali sehari sesudah makan",
    timing: {
      repeat: {
        frequency: 3,
        period: 1,
        periodUnit: "d",
      },
    },
  })
  .setDispenseRequest({
    quantity: {
      value: 12,
      unit: "CAP",
      system: "http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm",
      code: "CAP",
    },
    expectedSupplyDuration: {
      value: 4,
      unit: "days",
      system: "http://unitsofmeasure.org",
      code: "d",
    },
  })
  .setSubstitution({
    allowedBoolean: false,
  })
  .addNote({
    text: "Antibiotik oral dimulai setelah pasien diputuskan pulang dari observasi IGD.",
  });

const medicationRequest = await client.medicationRequest.create(
  medicationRequestBuilder.buildMedicationRequest(),
);
```

## Method Utama

- `setSubject(reference)`
- `setEncounter(reference)`
- `mergeMedicationRequest(partialMedicationRequest)`
- `addIdentifier(identifier)`
- `addBasedOn(reference)`
- `addCategory(codeableConcept)`
- `addReasonCode(codeableConcept)`
- `addReasonReference(reference)`
- `addInsurance(reference)`
- `addNote(note)`
- `addDosageInstruction(dosageInstruction)`
- `setStatus(status)`
- `setStatusReason(codeableConcept)`
- `setIntent(intent)`
- `setPriority(priority)`
- `setReportedBoolean(boolean)`
- `setMedicationReference(reference)`
- `setAuthoredOn(dateTime)`
- `setRequester(reference)`
- `setPerformer(reference)`
- `setPerformerType(codeableConcept)`
- `setRecorder(reference)`
- `setDispenseRequest(dispenseRequest)`
- `setSubstitution(substitution)`
- `buildMedicationRequest()`

## Catatan

- `buildMedicationRequest()` selalu menghasilkan payload `MedicationRequest` yang valid terhadap schema SDK.
- Helper ini tidak melakukan create ke API secara otomatis; gunakan hasil `buildMedicationRequest()` bersama `client.medicationRequest.create(...)`.
- Karena `subject` dan `encounter` di-set dari konteks workflow, helper ini cocok dipakai setelah `Encounter` berhasil dibuat dan aplikasi ingin melanjutkan ke resep atau order terapi.

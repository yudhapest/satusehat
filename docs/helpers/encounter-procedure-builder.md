# Encounter -> Procedure Builder

## Ringkasan

Helper `createEncounterProcedureBuilder` ditujukan untuk alur pasca-`Encounter`, terutama saat `Encounter` IGD sudah berhasil dibuat lalu aplikasi perlu:

- membangun payload `Procedure` yang otomatis mewarisi `subject` dan referensi `Encounter`
- menjaga perubahan `subject` dan `encounter` tetap sinkron selama draft masih disusun
- menambahkan detail tindakan klinis seperti `performer`, `reasonCode`, `bodySite`, `report`, dan catatan tindakan tanpa menyusun object mentah berulang kali

Helper ini cocok untuk workflow sederhana `Encounter -> Procedure`, misalnya rekam tindakan EKG, imaging bedside, atau tindakan klinis awal lain setelah pasien selesai triase.

## Contoh Alur IGD Sederhana

```ts
import {
  createEmergencyEncounterHistory,
  createEncounterBuilder,
  createEncounterProcedureBuilder,
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
          code: "DD",
          display: "Discharge diagnosis",
        },
      ],
    },
    rank: 1,
  },
  location: {
    location: {
      reference: "Location/igd-resus-02",
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

const procedureBuilder = createEncounterProcedureBuilder({
  subject: encounterDraft.build().subject,
  encounter: {
    reference: `Encounter/${createdEncounter.id}`,
  },
  procedure: {
    status: "completed",
    category: {
      coding: [
        {
          system: "http://snomed.info/sct",
          code: "103693007",
          display: "Diagnostic procedure",
        },
      ],
    },
    code: {
      coding: [
        {
          system: "http://hl7.org/fhir/sid/icd-9-cm",
          code: "89.52",
          display: "Electrocardiogram",
        },
      ],
    },
    reasonCode: encounterDraft.build().reasonCode,
    location: {
      reference: "Location/igd-resus-02",
      display: "Bed Observasi IGD 02",
    },
  },
})
  .addPerformer({
    actor: {
      reference: "Practitioner/N10000006",
      display: "dr. Andi",
    },
  })
  .setPerformedDateTime("2024-04-03T01:25:00+00:00")
  .addNote({
    text: "EKG 12 sadapan dilakukan setelah pasien stabil di area observasi.",
  });

const procedure = await client.procedure.create(procedureBuilder.buildProcedure());
```

## Method Utama

- `setSubject(reference)`
- `setEncounter(reference)`
- `mergeProcedure(partialProcedure)`
- `addIdentifier(identifier)`
- `addBasedOn(reference)`
- `addPartOf(reference)`
- `addPerformer(performer)`
- `addReasonCode(codeableConcept)`
- `addReasonReference(reference)`
- `addBodySite(codeableConcept)`
- `addReport(reference)`
- `addComplication(codeableConcept)`
- `addComplicationDetail(reference)`
- `addFollowUp(codeableConcept)`
- `addNote(note)`
- `addFocalDevice(focalDevice)`
- `addUsedReference(reference)`
- `addUsedCode(codeableConcept)`
- `setStatus(status)`
- `setStatusReason(codeableConcept)`
- `setCategory(codeableConcept)`
- `setLocation(reference)`
- `setOutcome(codeableConcept)`
- `setRecorder(reference)`
- `setAsserter(reference)`
- `setPerformedDateTime(dateTime)`
- `setPerformedPeriod(period)`
- `clearPerformed()`
- `buildProcedure()`

## Catatan

- `buildProcedure()` selalu menghasilkan payload `Procedure` yang valid terhadap schema SDK.
- `setPerformedDateTime(...)` dan `setPerformedPeriod(...)` saling menimpa agar draft helper tetap memakai satu representasi waktu tindakan yang jelas.
- Helper ini tidak melakukan create ke API secara otomatis; gunakan hasil `buildProcedure()` bersama `client.procedure.create(...)`.

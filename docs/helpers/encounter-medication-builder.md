# Encounter -> Medication Builder

## Ringkasan

Helper `createEncounterMedicationBuilder` ditujukan untuk alur pasca-`Encounter` ketika aplikasi perlu menyiapkan resource `Medication` sebelum melanjutkan ke `MedicationRequest` atau `MedicationAdministration`.

Berbeda dari `Condition`, `Procedure`, `MedicationRequest`, atau `MedicationAdministration`, resource `Medication` tidak menyimpan field `subject` atau `encounter` secara langsung. Karena itu helper ini fokus pada:

- menyusun payload `Medication` yang valid terhadap schema SDK tanpa menulis object mentah berulang kali
- merapikan detail farmasi seperti `identifier`, `code`, `form`, `ingredient`, `batch`, dan `MedicationType`
- membentuk `Reference` yang konsisten untuk dipakai ulang oleh workflow lanjutan seperti `MedicationRequest` dan `MedicationAdministration`

Helper ini cocok untuk workflow terapi pasca-encounter, misalnya saat klinisi sudah menyelesaikan asesmen awal lalu aplikasi ingin:

1. membuat resource `Medication`
2. memakai hasil referensi obat itu pada order resep
3. memakai referensi yang sama lagi ketika obat benar-benar diberikan

## Contoh Alur Sederhana

```ts
import {
  createEncounterMedicationAdministrationBuilder,
  createEncounterMedicationBuilder,
  createEncounterMedicationRequestBuilder,
} from "@digitalmedika/satusehat";

const medicationBuilder = createEncounterMedicationBuilder({
  medication: {
    code: {
      coding: [
        {
          system: "http://sys-ids.kemkes.go.id/kfa",
          code: "93001002",
          display: "Paracetamol 500 mg tablet",
        },
      ],
    },
    extension: [
      {
        url: "https://fhir.kemkes.go.id/r4/StructureDefinition/MedicationType",
        valueCodeableConcept: {
          coding: [
            {
              system: "http://terminology.kemkes.go.id/CodeSystem/medication-type",
              code: "NC",
              display: "Non-compound",
            },
          ],
        },
      },
    ],
  },
})
  .addIdentifier({
    system: "http://sys-ids.kemkes.go.id/medication/10000004",
    use: "official",
    value: "MED-IGD-001",
  })
  .setStatus("active")
  .setForm({
    coding: [
      {
        system: "http://terminology.kemkes.go.id/CodeSystem/medication-form",
        code: "BS066",
        display: "Tablet",
      },
    ],
  });

const medication = await client.medication.create(medicationBuilder.buildMedication());

const medicationReference = medicationBuilder.buildMedicationReference({
  medicationId: medication.id,
});

const medicationRequest = await client.medicationRequest.create(
  createEncounterMedicationRequestBuilder({
    subject: {
      reference: "Patient/100000030009",
      display: "Budi Santoso",
    },
    encounter: {
      reference: "Encounter/enc-123",
    },
    medicationRequest: {
      status: "active",
      intent: "order",
      medicationReference,
    },
  }).buildMedicationRequest(),
);

const medicationAdministration = await client.medicationAdministration.create(
  createEncounterMedicationAdministrationBuilder({
    subject: {
      reference: "Patient/100000030009",
      display: "Budi Santoso",
    },
    encounter: {
      reference: "Encounter/enc-123",
    },
    medicationAdministration: {
      status: "completed",
      medicationReference,
      effectiveDateTime: "2024-04-03T02:15:00+00:00",
    },
  })
    .setRequest({
      reference: `MedicationRequest/${medicationRequest.id}`,
    })
    .buildMedicationAdministration(),
);
```

## Contoh Workflow End-to-End

Contoh berikut menunjukkan rangkaian `Encounter -> Condition -> Procedure -> Medication -> MedicationRequest -> MedicationAdministration`.

```ts
import {
  createEncounterBuilder,
  createEncounterConditionBuilder,
  createEncounterMedicationAdministrationBuilder,
  createEncounterMedicationBuilder,
  createEncounterMedicationRequestBuilder,
  createEncounterProcedureBuilder,
  createEmergencyEncounterHistory,
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
        code: "65363002",
        display: "Otitis media",
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

const encounter = await client.encounter.create(encounterDraft.build());

const conditionBuilder = createEncounterConditionBuilder({
  subject: encounterDraft.build().subject,
  encounter: {
    reference: `Encounter/${encounter.id}`,
  },
  condition: {
    code: {
      coding: [
        {
          system: "http://hl7.org/fhir/sid/icd-10",
          code: "H66.9",
          display: "Otitis media, unspecified",
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
  },
});

const condition = await client.condition.create(conditionBuilder.buildCondition());

const procedure = await client.procedure.create(
  createEncounterProcedureBuilder({
    subject: encounterDraft.build().subject,
    encounter: {
      reference: `Encounter/${encounter.id}`,
    },
    procedure: {
      status: "completed",
      code: {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: "386053000",
            display: "Evaluation procedure",
          },
        ],
      },
    },
  })
    .addReasonReference({
      reference: `Condition/${condition.id}`,
      display: condition.code?.coding[0]?.display,
    })
    .buildProcedure(),
);

const medicationBuilder = createEncounterMedicationBuilder({
  medication: {
    code: {
      coding: [
        {
          system: "http://sys-ids.kemkes.go.id/kfa",
          code: "93001002",
          display: "Paracetamol 500 mg tablet",
        },
      ],
    },
    extension: [
      {
        url: "https://fhir.kemkes.go.id/r4/StructureDefinition/MedicationType",
        valueCodeableConcept: {
          coding: [
            {
              system: "http://terminology.kemkes.go.id/CodeSystem/medication-type",
              code: "NC",
              display: "Non-compound",
            },
          ],
        },
      },
    ],
  },
})
  .addIdentifier({
    system: "http://sys-ids.kemkes.go.id/medication/10000004",
    use: "official",
    value: "MED-IGD-001",
  })
  .setStatus("active");

const medication = await client.medication.create(medicationBuilder.buildMedication());

const medicationReference = medicationBuilder.buildMedicationReference({
  medicationId: medication.id,
});

const medicationRequest = await client.medicationRequest.create(
  createEncounterMedicationRequestBuilder({
    subject: encounterDraft.build().subject,
    encounter: {
      reference: `Encounter/${encounter.id}`,
    },
    medicationRequest: {
      status: "active",
      intent: "order",
      medicationReference,
      reasonCode: encounterDraft.build().reasonCode,
    },
  })
    .addReasonReference({
      reference: `Condition/${condition.id}`,
      display: condition.code?.coding[0]?.display,
    })
    .addBasedOn({
      reference: `Procedure/${procedure.id}`,
      display: procedure.code.coding[0]?.display,
    })
    .setRequester({
      reference: "Practitioner/N10000001",
      display: "Dokter Jaga IGD",
    })
    .addDosageInstruction({
      sequence: 1,
      text: "Minum 1 tablet 3 kali sehari sesudah makan",
    })
    .buildMedicationRequest(),
);

const medicationAdministration = await client.medicationAdministration.create(
  createEncounterMedicationAdministrationBuilder({
    subject: encounterDraft.build().subject,
    encounter: {
      reference: `Encounter/${encounter.id}`,
    },
    medicationAdministration: {
      status: "completed",
      medicationReference,
      effectiveDateTime: "2024-04-03T02:20:00+00:00",
      reasonCode: encounterDraft.build().reasonCode,
    },
  })
    .setRequest({
      reference: `MedicationRequest/${medicationRequest.id}`,
    })
    .addSupportingInformation({
      reference: `Condition/${condition.id}`,
      display: condition.code?.coding[0]?.display,
    })
    .addPartOf({
      reference: `Procedure/${procedure.id}`,
      display: procedure.code.coding[0]?.display,
    })
    .addNote({
      text: "Parasetamol oral diberikan setelah evaluasi dokter selesai.",
    })
    .buildMedicationAdministration(),
);
```

## Method Utama

- `mergeMedication(partialMedication)`
- `addIdentifier(identifier)`
- `setCode(codeableConcept)`
- `setStatus(status)`
- `setManufacturer(reference)`
- `setForm(codeableConcept)`
- `setAmount(ratio)`
- `addIngredient(ingredient)`
- `setBatch(batch)`
- `addExtension(extension)`
- `setMedicationType(valueCodeableConcept)`
- `buildMedication()`
- `buildMedicationReference({ medicationId | medicationReference, display? })`

## Catatan

- `buildMedication()` selalu menghasilkan payload `Medication` yang valid terhadap schema SDK.
- `buildMedicationReference(...)` membantu menjaga referensi obat tetap konsisten saat payload hasil `Medication` dipakai lagi oleh builder lain.
- Kalau `display` tidak diberikan saat membangun referensi, helper akan mencoba memakai `display` dari `medication.code.coding`.

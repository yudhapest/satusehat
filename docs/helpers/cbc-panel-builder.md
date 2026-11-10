# CBC Panel Builder

## Ringkasan

Helper `createCompleteBloodCountPanelBuilder` adalah preset di atas `createLaboratoryPanelBuilder` untuk panel `CBC` atau hematologi lengkap.

Preset ini sudah menyiapkan:

- kode panel `ServiceRequest` dan `DiagnosticReport`
- tipe `Specimen` darah
- observation default untuk item CBC umum
- unit default saat hasil diberikan sebagai angka biasa

## Observation Default

Observation yang selalu dibuat:

- `wbc`
- `rbc`
- `hemoglobin`
- `hematocrit`
- `mcv`
- `mch`
- `mchc`
- `platelets`

Observation opsional:

- `rdw`
- `pdw`
- `mpv`

Observation opsional ikut dibuat jika:

- `includeOptionalObservations: true`, atau
- ada nilai hasil yang diberikan untuk observation tersebut

## Contoh Dasar

```ts
import {
  createCompleteBloodCountPanelBuilder,
  createEncounterBuilder,
} from "@digitalmedika/satusehat";

const encounterDraft = createEncounterBuilder({
  preset: "outpatient",
  identifier: {
    system: "http://sys-ids.kemkes.go.id/encounter/10000004",
    use: "official",
    value: "CBC-20240001",
  },
  status: "arrived",
  subject: {
    reference: "Patient/100000030009",
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
      reference: "Location/poli-lab",
      display: "Poliklinik Rawat Jalan",
    },
    status: "active",
  },
  serviceProvider: {
    reference: "Organization/10000004",
  },
}).build();

const createdEncounter = await client.encounter.create(encounterDraft);

const builder = createCompleteBloodCountPanelBuilder({
  subject: encounterDraft.subject,
  encounter: {
    reference: `Encounter/${createdEncounter.id}`,
  },
  results: {
    wbc: 7.2,
    rbc: 4.8,
    hemoglobin: 13.5,
    hematocrit: 41,
    mcv: 86,
    mch: 28,
    mchc: 33,
    platelets: 280,
  },
});

const serviceRequest = await client.serviceRequest.create(builder.buildServiceRequest());
const specimen = await client.specimen.create(
  builder.buildSpecimen({
    serviceRequestId: serviceRequest.id,
  }),
);

const observationEntries = builder.buildObservationEntries({
  serviceRequestId: serviceRequest.id,
  specimenId: specimen.id,
});

const createdObservations = [];

for (const entry of observationEntries) {
  const created = await client.observation.create(entry.body);
  createdObservations.push(created.id);
}

const diagnosticReport = await client.diagnosticReport.create(
  builder.buildDiagnosticReport({
    serviceRequestId: serviceRequest.id,
    specimenId: specimen.id,
    resultIds: createdObservations,
  }),
);
```

## Catatan

- Jika nilai diberikan sebagai angka, helper akan mengisi unit CBC bawaan secara otomatis.
- Jika Anda butuh custom quantity penuh, kirim object `ObservationQuantity` di `results`.
- Karena helper ini mengembalikan `LaboratoryPanelBuilder`, semua helper lanjutan seperti `mergeDiagnosticReport(...)` atau `addObservationNote(...)` tetap bisa dipakai.

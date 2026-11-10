# Condition

## Ringkasan

Resource `condition` saat ini mendukung:

- `getById`
- `search`
- `create`
- `patch`
- `update`

Dokumentasi resmi SATUSEHAT yang menjadi acuan:

- [FHIR Condition](https://satusehat.kemkes.go.id/platform/docs/id/fhir/resources/condition/)
- [ReST API Condition](https://satusehat.kemkes.go.id/platform/docs/id/api-catalogue/integrations/apis/condition/)

## Search

Saat ini query yang dimodelkan adalah:

- `subject`
- `encounter`

Minimal salah satu query di atas harus diisi.

```ts
const result = await client.condition.search({
  subject: "100000030009",
  encounter: "2b2d0a3e-082a-4fe9-ae13-da9c3b5e422f",
});
```

## Get By ID

```ts
const condition = await client.condition.getById({
  id: "2a4e1a13-ee52-4c8b-a2ef-f41c79de698d",
});
```

## Create

Field wajib yang saat ini dimodelkan:

- `resourceType`
- `code`
- `subject`
- `encounter`

Field opsional yang saat ini dimodelkan:

- `identifier`
- `clinicalStatus`
- `verificationStatus`
- `category`
- `severity`
- `bodySite`
- `onsetDateTime`
- `onsetAge`
- `onsetPeriod`
- `onsetRange`
- `onsetString`
- `abatementDateTime`
- `abatementAge`
- `abatementPeriod`
- `abatementRange`
- `abatementString`
- `recordedDate`
- `recorder`
- `asserter`
- `stage`
- `evidence`
- `note`

Contoh create:

```ts
const condition = await client.condition.create({
  resourceType: "Condition",
  identifier: [
    {
      system: "http://sys-ids.kemkes.go.id/condition/10000004",
      use: "official",
      value: "5234342",
    },
  ],
  clinicalStatus: {
    coding: [
      {
        system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
        code: "active",
        display: "Active",
      },
    ],
  },
  verificationStatus: {
    coding: [
      {
        system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
        code: "provisional",
        display: "Provisional",
      },
    ],
  },
  category: [
    {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/condition-category",
          code: "encounter-diagnosis",
          display: "Encounter Diagnosis",
        },
      ],
    },
  ],
  code: {
    coding: [
      {
        system: "http://hl7.org/fhir/sid/icd-10",
        code: "C47.0",
        display: "Malignant neoplasm, peripheral nerves of head, face and neck",
      },
    ],
  },
  subject: {
    reference: "Patient/100000030009",
    display: "Budi Santoso",
  },
  encounter: {
    reference: "Encounter/2b2d0a3e-082a-4fe9-ae13-da9c3b5e422f",
  },
  onsetDateTime: "2024-04-01T01:15:00+00:00",
  recordedDate: "2024-04-01T01:20:00+00:00",
  recorder: {
    reference: "Practitioner/N10000001",
    display: "Dokter Bronsig",
  },
  note: [
    {
      text: "Diagnosis awal saat kunjungan.",
    },
  ],
});
```

## Update

Method `update` menggunakan `PUT`, jadi body yang dikirim adalah representasi resource `Condition` utuh sesuai schema SDK saat ini.

## Patch

Method `patch` menggunakan operasi JSON patch yang saat ini divalidasi sebagai array berisi operasi `replace`.

```ts
const updated = await client.condition.patch({
  id: "2a4e1a13-ee52-4c8b-a2ef-f41c79de698d",
  body: [
    {
      op: "replace",
      path: "/recordedDate",
      value: "2024-04-01T02:00:00+00:00",
    },
  ],
});
```

## Catatan

- Search `Condition` di SDK ini mengikuti parameter resmi SATUSEHAT yaitu `subject` dan `encounter`.
- Schema saat ini difokuskan untuk use case diagnosis yang umum. Kalau nanti kita butuh coverage yang lebih dalam untuk tahap klinis, evidence, atau use case discharge condition, kita bisa perluas secara bertahap.

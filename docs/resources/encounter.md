# Encounter

## Ringkasan

Resource `encounter` saat ini mendukung:

- `getById`
- `search`
- `create`
- `patch`
- `update`

Dokumentasi resmi SATUSEHAT yang menjadi acuan:

- [FHIR Encounter](https://satusehat.kemkes.go.id/platform/docs/id/fhir/resources/encounter/)
- [ReST API Encounter](https://satusehat.kemkes.go.id/platform/docs/id/api-catalogue/integrations/apis/encounter/)

## Search

Saat ini query yang dimodelkan adalah:

- `subject`

```ts
const result = await client.encounter.search({
  subject: "100000030009",
});
```

## Get By ID

```ts
const encounter = await client.encounter.getById({
  id: "4f735a03-128b-464d-bf91-e6eacdf1c38f",
});
```

## Create

Field wajib yang saat ini dimodelkan:

- `resourceType`
- minimal 1 `identifier`
- `status`
- minimal 1 `statusHistory`
- `class`
- minimal 1 `classHistory`
- `subject`
- `period`
- minimal 1 `reasonCode`
- minimal 1 `location`
- `serviceProvider`

Catatan: `diagnosis` saat ini dibuat opsional di schema SDK supaya flow create awal tanpa diagnosis tetap bisa divalidasi. Ini berguna untuk kasus di mana `Condition` baru tersedia setelah `Encounter` berhasil dibuat.

Contoh create:

```ts
const encounter = await client.encounter.create({
  resourceType: "Encounter",
  identifier: [
    {
      system: "http://sys-ids.kemkes.go.id/encounter/10000004",
      use: "official",
      value: "P20240001",
    },
  ],
  status: "arrived",
  statusHistory: [
    {
      status: "arrived",
      period: {
        start: "2024-04-01T01:00:00+00:00",
        end: "2024-04-01T01:10:00+00:00",
      },
    },
  ],
  class: {
    system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
    code: "AMB",
    display: "ambulatory",
  },
  classHistory: [
    {
      class: {
        system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
        code: "AMB",
        display: "ambulatory",
      },
      period: {
        start: "2024-04-01T01:00:00+00:00",
        end: "2024-04-01T02:00:00+00:00",
      },
    },
  ],
  subject: {
    reference: "Patient/100000030009",
    display: "Budi Santoso",
  },
  period: {
    start: "2024-04-01T01:00:00+00:00",
    end: "2024-04-01T02:00:00+00:00",
  },
  reasonCode: [
    {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/encounter-reason",
          code: "185349003",
          display: "Encounter for check up",
        },
      ],
    },
  ],
  diagnosis: [
    {
      condition: {
        reference: "Condition/4bbbe654-14f5-4ab3-a36e-a1e307f67bb8",
        display: "Tuberculosis of lung",
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
  ],
  location: [
    {
      location: {
        reference: "Location/408ba28c-3115-4df5-85c6-60f15b44e7fa",
        display: "Ruang 1A, Poliklinik Rawat Jalan",
      },
      status: "active",
    },
  ],
  serviceProvider: {
    reference: "Organization/10000004",
    display: "RS SATUSEHAT",
  },
});
```

## Update

Method `update` menggunakan `PUT`, jadi body yang dikirim adalah representasi resource `Encounter` utuh sesuai schema SDK saat ini.

## Patch

Method `patch` menggunakan operasi JSON patch yang saat ini divalidasi sebagai array berisi operasi `replace`.

```ts
const updated = await client.encounter.patch({
  id: "4f735a03-128b-464d-bf91-e6eacdf1c38f",
  body: [
    {
      op: "replace",
      path: "/status",
      value: "finished",
    },
  ],
});
```

## Catatan

- Search `Encounter` yang dimodelkan di SDK ini mengikuti parameter `subject` yang terdokumentasi pada API SATUSEHAT.
- Schema saat ini fokus pada elemen inti yang umum dipakai untuk pencatatan kunjungan. Jika nanti kita perlu perluas ke use case tertentu, field tambahan masih bisa kita tambahkan tanpa mengubah pola client yang ada.

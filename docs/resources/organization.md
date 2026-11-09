# Organization

## Ringkasan

Resource `organization` saat ini mendukung:

- `getById`
- `search`
- `create`
- `update`

## Search

Minimal salah satu query berikut harus diisi:

- `name`
- `partof`

### Search by name

```ts
const result = await client.organization.search({
  name: "paramarta",
});
```

### Search by parent organization

```ts
const result = await client.organization.search({
  partof: "10000004",
});
```

## Get By ID

```ts
const organization = await client.organization.getById({
  id: "38d2fd4d-1402-4e5f-8f09-618fca5ce313",
});
```

Pada response (`getById`, `search`, dan hasil `create`/`update`), `identifier` dan `type` bersifat opsional sesuai kardinalitas FHIR. Organisasi induk yang didaftarkan Kemenkes bisa dikembalikan dengan `identifier: []` dan tanpa `type`, jadi tangani kemungkinan kosong:

```ts
const identifierValue = organization.identifier?.[0]?.value;
```

Aturan ketat di bagian [Create](#create) tetap berlaku untuk payload yang dikirim.

## Create

Field wajib yang saat ini dimodelkan:

- `resourceType`
- `active`
- minimal 1 `identifier`
- minimal 1 `type`
- `name`

Field opsional yang saat ini dimodelkan:

- `alias`
- `telecom`
- `address`
- `partOf`
- `contact`
- `endpoint`

Contoh create dengan builder:

```ts
import { createOrganizationBuilder } from "@digitalmedika/satusehat";

const body = createOrganizationBuilder({
  active: true,
  identifier: {
    system: "http://sys-ids.kemkes.go.id/organization/10000004",
    value: "10000004",
  },
  name: "Puskesmas SATUSEHAT",
  type: {
    coding: [
      {
        system: "http://terminology.hl7.org/CodeSystem/organization-type",
        code: "prov",
        display: "Healthcare Provider",
      },
    ],
  },
})
  .addAlias("PKM SATUSEHAT")
  .addTelecom({
    system: "phone",
    value: "0211234567",
    use: "work",
  })
  .addAddress({
    use: "work",
    line: ["Jl. Kebon Jeruk No. 1"],
    city: "Jakarta",
    country: "ID",
  })
  .build();

const organization = await client.organization.create(body);
```

## Update

```ts
const updated = await client.organization.update({
  id: "38d2fd4d-1402-4e5f-8f09-618fca5ce313",
  body,
});
```

## Array Helpers

Builder `OrganizationBuilder` menyediakan helper untuk field yang bisa diisi lebih dari satu:

- `addIdentifier`
- `addType`
- `addAlias`
- `addTelecom`
- `addAddress`
- `addContact`
- `addEndpoint`

Contoh `address` lebih dari satu:

```ts
const body = createOrganizationBuilder({
  active: true,
  identifier: {
    system: "http://sys-ids.kemkes.go.id/organization/10000004",
    value: "10000004",
  },
  name: "Puskesmas SATUSEHAT",
  type: {
    coding: [
      {
        system: "http://terminology.hl7.org/CodeSystem/organization-type",
        code: "prov",
      },
    ],
  },
})
  .addAddress({
    use: "work",
    line: ["Jl. Alamat Utama"],
    city: "Jakarta",
    country: "ID",
  })
  .addAddress({
    use: "billing",
    line: ["Jl. Alamat Billing"],
    city: "Jakarta",
    country: "ID",
  })
  .build();
```

## Catatan

Schema `Organization` yang ada sekarang mengikuti field SATUSEHAT/FHIR yang paling relevan untuk create/update awal. Kita masih bisa memperluasnya lagi bila ada elemen tambahan yang perlu dimodelkan lebih detail.

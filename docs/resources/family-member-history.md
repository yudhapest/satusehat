# FamilyMemberHistory

## Ringkasan

`FamilyMemberHistory` dipakai untuk **Riwayat Penyakit Keluarga** pada Pengiriman Data Anamnesis (Rawat Jalan, IGD, dan Rawat Inap). Untuk alur anamnesis, lebih mudah memakai [Anamnesis Builder](../helpers/anamnesis-builder.md).

Operasi yang tersedia:

- `client.familyMemberHistory.create(payload)`
- `client.familyMemberHistory.getById({ id })`
- `client.familyMemberHistory.search({ patient })`
- `client.familyMemberHistory.update({ id, body })`
- `client.familyMemberHistory.patch({ id, body })`

## Create

Field wajib menurut panduan SATUSEHAT:

- `status` (`partial`, `completed`, `entered-in-error`, `health-unknown`)
- `patient`
- `relationship` (panduan anamnesis memakai `FAMMEMB` / Family member dari `http://terminology.hl7.org/CodeSystem/v3-RoleCode`)
- minimal satu `condition` dengan `condition.code`

```ts
const history = await client.familyMemberHistory.create({
  resourceType: "FamilyMemberHistory",
  status: "completed",
  patient: { reference: "Patient/P02478375538" },
  relationship: {
    coding: [
      {
        system: "http://terminology.hl7.org/CodeSystem/v3-RoleCode",
        code: "FAMMEMB",
        display: "Family member",
      },
    ],
  },
  condition: [
    {
      code: {
        coding: [{ system: "http://snomed.info/sct", code: "160303001", display: "FH: Diabetes mellitus" }],
      },
      contributedToDeath: false,
    },
  ],
});
```

## Terminologi

- `condition.code`: SNOMED CT `<< 416471007 |Family history of clinical finding|` atau `<< 160266009 |No family history of clinical finding|`, atau kode Kemenkes di `FAMILY_MEMBER_HISTORY_CONDITIONS` (`TK000317`, `TK000318`).
- `condition.outcome`: SNOMED CT `<< 418138009 |Patient condition finding|`.
- `condition.onset[x]`: `onsetAge`, `onsetRange`, `onsetPeriod`, atau `onsetString`.
- `deceasedBoolean`: apakah anggota keluarga sudah meninggal.

Sumber: Lampiran Standar Terminologi SATUSEHAT v12.0 bab 29 dan tabel pemetaan Anamnesis di panduan Rawat Jalan, IGD, dan Rawat Inap.

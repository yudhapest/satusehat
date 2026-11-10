# DICOM Router

## Ringkasan

Resource `dicomRouter` saat ini mendukung:

- `downloadConfig`

Endpoint ini mengunduh isi file `docker-compose.yml` DICOM Router dari endpoint SATUSEHAT:

- sandbox: `https://api-satusehat-stg.dto.kemkes.go.id/dicom-router`
- production: `https://api-satusehat.kemkes.go.id/dicom-router`

Response dikembalikan sebagai `string` agar bisa langsung disimpan ke file oleh consumer SDK.

## Download Config

```ts
import { writeFile } from "node:fs/promises";

const dockerCompose = await client.dicomRouter.downloadConfig();

await writeFile("./docker-compose.yml", dockerCompose);
```

## Override Base URL

Kalau environment kamu memakai proxy atau gateway sendiri untuk endpoint DICOM Router, set `dicomBaseUrl` saat membuat client:

```ts
const client = createSatuSehatClient({
  environment: "sandbox",
  credentials: {
    clientId: process.env.SATUSEHAT_CLIENT_ID!,
    clientSecret: process.env.SATUSEHAT_CLIENT_SECRET!,
  },
  dicomBaseUrl: "https://proxy.example.com/satusehat",
});
```

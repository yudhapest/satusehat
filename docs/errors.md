# Errors

SDK ini mengekspos beberapa error class agar handling di aplikasi consumer tetap eksplisit dan typed.

## Error yang Tersedia

### `SatuSehatConfigError`

Dipakai saat konfigurasi client tidak valid, misalnya:

- `SATUSEHAT_ENV` bukan `sandbox` atau `production`
- credential OAuth2 tidak lengkap

Contoh:

```ts
import { SatuSehatConfigError, createSatuSehatClientFromEnv } from "@digitalmedika/satusehat";

try {
  const client = createSatuSehatClientFromEnv();
  await client.patient.search({
    identifier: "https://fhir.kemkes.go.id/id/nik|9271060312000001",
  });
} catch (error) {
  if (error instanceof SatuSehatConfigError) {
    console.error("Konfigurasi SATUSEHAT belum valid:", error.message);
  }
}
```

### Rate limit (HTTP 429)

SATUSEHAT membatasi jumlah request per waktu. Saat batas terlampaui, server membalas `429` ("Rate limit quota violation") dan SDK melempar `SatuSehatApiError` dengan `status === 429`; SDK tidak mencoba ulang otomatis. Untuk pengiriman massal (misalnya satu kunjungan dengan puluhan Observation), kirim lewat antrean dengan jeda dan coba ulang request yang mendapat 429 setelah beberapa saat.

### `SatuSehatValidationError`

Dipakai saat:

- query request tidak sesuai schema
- body request tidak sesuai schema
- response API tidak sesuai schema yang dimodelkan SDK

Error ini menyertakan properti `issues` dari Zod.

```ts
import { SatuSehatValidationError } from "@digitalmedika/satusehat";

try {
  await client.location.search({});
} catch (error) {
  if (error instanceof SatuSehatValidationError) {
    console.error(error.message);
    console.error(error.issues);
  }
}
```

### `SatuSehatApiError`

Dipakai saat API mengembalikan status non-2xx.

Properti yang tersedia:

- `status`
- `response`

Perlu diperhatikan bahwa payload `response` tidak selalu JSON. Pada beberapa dokumentasi resmi SATUSEHAT, respons `5xx` untuk endpoint lookup seperti `Practitioner` dapat dikembalikan sebagai `text/plain` seperti `Gateway Timeout`. SDK akan mempertahankan payload mentah tersebut di properti `response`.

```ts
import { SatuSehatApiError } from "@digitalmedika/satusehat";

try {
  await client.organization.getById({
    id: "unknown-id",
  });
} catch (error) {
  if (error instanceof SatuSehatApiError) {
    console.error("HTTP status:", error.status);
    console.error("Payload:", error.response);
  }
}
```

## Catatan Retry `401`

Jika client dibuat dengan `credentials` dan `tokenStore` yang bisa di-invalidasi, transport SDK akan:

1. mencoba request dengan token saat ini
2. bila menerima `401`, menghapus token cache
3. mengambil token baru
4. mengulang request sekali

Jika setelah retry status tetap `401`, SDK akan melempar `SatuSehatApiError`.

## Rekomendasi Handling

Pola yang aman biasanya:

1. tangani `SatuSehatConfigError` sebagai masalah setup
2. tangani `SatuSehatValidationError` sebagai masalah integrasi/schema
3. tangani `SatuSehatApiError` sebagai masalah request ke SATUSEHAT
4. sisakan fallback untuk error umum lain di luar SDK

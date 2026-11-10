# Releasing

Fork ini tidak di-publish ke npm. Setiap push tag `v*`, workflow `Release` menjalankan `npm run verify`, mem-build tarball dengan `npm pack`, lalu melampirkannya ke GitHub Release. Consumer (misalnya `web-simrs-fastify`) menginstall dari URL tarball itu.

Kenapa tidak `npm install github:yudhapest/satusehat`? `dist/` tidak di-commit, sementara npm 11 gagal menyiapkan dependency git yang perlu di-build (`--allow-scripts is not allowed in project-scoped installs`). Tarball sudah berisi `dist/`, jadi tidak ada build di sisi consumer.

Versi dan `CHANGELOG.md` tetap dikelola dengan [Changesets](https://github.com/changesets/changesets).

## Cara rilis

1. Setiap ada perubahan yang ingin masuk release, jalankan:

```bash
npm run changeset
```

2. Isi ringkasan perubahan. Isi ini akan dipakai sebagai release notes.

3. Saat siap rilis, naikkan versi dan update `CHANGELOG.md`:

```bash
npm run version-packages
npm install          # sinkronkan package-lock.json
npm run verify       # typecheck + test + build
```

4. Commit, buat tag (harus sama dengan `version` di `package.json`), lalu push:

```bash
git commit -am "chore: release v0.10.4"
git tag v0.10.4
git push origin main --tags
```

5. Setelah workflow selesai, update dependency di consumer:

```bash
npm install https://github.com/yudhapest/satusehat/releases/download/v0.10.4/digitalmedika-satusehat-0.10.4.tgz
```

## Development bersama consumer

Untuk mencoba perubahan di consumer sebelum rilis, buat tarball lokal:

```bash
npm pack                                   # menghasilkan digitalmedika-satusehat-<versi>.tgz
cd ../web-simrs-fastify
npm install ../satusehat/digitalmedika-satusehat-<versi>.tgz
```

## Sinkron dengan upstream

Repo asal ada di remote `upstream` (`digitalmedika/satusehat`):

```bash
git fetch upstream
git merge upstream/main
```

Test baru dari upstream masih memakai `bun:test`. Setelah merge, ganti import-nya:

```ts
import { describe, test } from "node:test";

import { expect } from "./helpers/expect";
```

Kalau upstream memakai `mock(...)` dari `bun:test`, ganti dengan `mock.fn(...)` dari `node:test`. Kalau upstream mengubah file workflow atau `bun.lock`, pertahankan versi fork (hapus `bun.lock`), lalu jalankan `npm run verify`.

## Release Notes

Sumber release notes berasal dari file changeset markdown yang kamu tulis. Jadi format paling aman adalah ringkas dan fokus pada perubahan user-facing, misalnya:

```md
### Added

- tambah helper baru untuk builder encounter rawat inap

### Fixed

- perbaiki validasi token cache file saat expiry kosong
```

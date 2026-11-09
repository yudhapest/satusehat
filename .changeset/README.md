# Changesets

Workflow release repo ini memakai Changesets.

## Saat ada perubahan yang perlu dirilis

Buat changeset baru:

```bash
npm run changeset
```

Pilih tipe rilis:

- `patch` untuk perbaikan bug atau perubahan kecil yang tetap kompatibel
- `minor` untuk fitur baru yang tetap kompatibel
- `major` untuk breaking change

Setelah itu commit file markdown yang dibuat di folder `.changeset/`.

## Saat changeset sudah masuk ke `main`

GitHub Actions akan:

1. membuat atau mengupdate Release PR
2. menaikkan versi package dan changelog saat PR release di-merge
3. publish ke npm
4. membuat GitHub Release dengan release notes

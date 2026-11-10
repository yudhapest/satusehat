---
"@digitalmedika/satusehat": minor
---

Add Pengiriman Data Anamnesis support for Rawat Jalan, IGD, and Rawat Inap.

- New `FamilyMemberHistory` resource client (`client.familyMemberHistory`: create, getById, search by patient, update, patch) and schemas, used for Riwayat Penyakit Keluarga.
- New `createAnamnesisBuilder` that builds validated payloads for keluhan utama (`chief-complaint`), keluhan penyerta (`problem-list-item`), riwayat penyakit pribadi (`previous-condition`), riwayat penyakit keluarga, riwayat alergi, and riwayat pengobatan, plus the `Encounter.diagnosis` entry with use `CC` for the keluhan utama.
- Terminology modules with the official codes from "Lampiran Standar Terminologi SATUSEHAT" v12.0: `CONDITION_*`, `ALLERGY_INTOLERANCE_*` (including the 30 official reaction manifestations), `MEDICATION_STATEMENT_CATEGORIES`, `FAMILY_MEMBER_*`, and shared systems (`SNOMED_CT_SYSTEM`, `KEMKES_TERMINOLOGY_SYSTEM`, `KFA_SYSTEM`) in `common-terminology`.
- `AllergyIntolerance` create and update now require `category`, `encounter`, and `recorder`, which the SATUSEHAT anamnesis guides mark as mandatory. Reading stored allergies is unaffected.
- `MedicationStatement` accepts `contained`, so a Medication referenced as `#id` is no longer dropped during validation.
- `AllergyIntolerance.reaction.manifestation` accepts a text-only CodeableConcept. The SATUSEHAT sandbox currently rejects every coding system there (RuleNumber 11149), and allergies stored with a text manifestation could not be read before. The anamnesis builder accepts `{ text }` manifestations.
- `npm run smoke:sandbox:write` sends the full anamnesis in the `rajal`, `igd`, and `ranap` scenarios.

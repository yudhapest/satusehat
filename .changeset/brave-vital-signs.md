---
"@digitalmedika/satusehat": minor
---

Add Pemeriksaan Fisik and IGD Triase support for Observation.

- New `createPhysicalExamBuilder` for the physical exam mapping shared by Rawat Jalan, Rawat Inap, and Asesmen Awal IGD: tanda vital and antropometri (`buildMeasurement`, `buildMeasurements`), tingkat kesadaran (`buildConsciousness`, LOINC 67775-7), and the 28 head-to-toe items (`buildHeadToToe`, `buildHeadToToeExams`, with the guide's SNOMED CT body sites).
- New `createEmergencyTriageBuilder` for Pengiriman Data Triase dan Gawat Darurat: sarana transportasi kedatangan (LOINC 74286-6), surat pengantar rujukan (OC000034), and kondisi pasien tiba (CTAS, LOINC 75910-0).
- New `observation-terminology` module (`OBSERVATION_CATEGORIES`, `OBSERVATION_MEASUREMENTS`, `OBSERVATION_CONSCIOUSNESS_LEVELS`, `OBSERVATION_HEAD_TO_TOE_EXAMS`, `OBSERVATION_ARRIVAL_TRANSPORT_MODES`, `OBSERVATION_TRIAGE_LEVELS`, ...) and `LOINC_SYSTEM` / `UCUM_SYSTEM` in `common-terminology`.
- `client.observation.create` and `update` now require `performer`, which the SATUSEHAT guides mark as mandatory (`ObservationSubmitSchema`). Builder drafts (`ObservationCreateSchema`) and reading stored observations are unaffected.
- `Observation` accepts `partOf`, `focus`, `valueRatio`, `valueTime`, `valueDateTime`, and `valuePeriod`, which were previously dropped during validation.
- `npm run smoke:sandbox:write` sends the full physical exam in all scenarios and the triase observations in the `igd` scenario.

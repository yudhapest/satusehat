---
"@digitalmedika/satusehat": minor
---

Align Encounter with the SATUSEHAT Rawat Jalan, IGD, and Rawat Inap guides and the "Lampiran Standar Terminologi SATUSEHAT" v12.0 (31 Oktober 2026).

**Breaking:**

- `createEncounterLocationServiceClassExtension`, `withEncounterLocationServiceClass`, and `EncounterBuilder.setLocationServiceClass` now take `{ careSetting, serviceClass, upgradeClass? }` instead of a string. The previous output (`.../StructureDefinition/serviceClass` with a `valueCode` sub-extension) did not match the SATUSEHAT ServiceClass extension, and SATUSEHAT does not reject unknown extensions, so those values were accepted but not usable. Submitting an Encounter with the old lowercase URL now fails validation; reading stored encounters is unaffected.
- `createEncounterClassFromConsultationMethod("TELEKONSULTASI")` now returns the official `VR` / `virtual` class instead of `TELE` / `teleconsultation`, which is not in the SATUSEHAT terminology.

**Terminology:** all Encounter code systems, extension URLs, and code tables now live in `src/schemas/encounter-terminology.ts` and are exported (`ENCOUNTER_CLASSES`, `ENCOUNTER_OUTPATIENT_SERVICE_CLASSES`, `ENCOUNTER_INPATIENT_SERVICE_CLASSES`, `ENCOUNTER_UPGRADE_CLASSES`, `ENCOUNTER_ADMIT_SOURCES`, `ENCOUNTER_DISCHARGE_DISPOSITIONS`, `ENCOUNTER_DIAGNOSIS_USES`, `ENCOUNTER_NOVELTY_CODES`, and the system constants).

**Encounter changes:**

- ServiceClass extension: `https://fhir.kemkes.go.id/r4/StructureDefinition/ServiceClass` with `value` (kelas perawatan: `reguler`/`eksekutif` for rawat jalan and IGD, `1`/`2`/`3`/`vip`/`vvip` and KRIS `kris-a`/`kris-b`/`kris-c` for rawat inap) and `upgradeClassIndicator` (`kelas-tetap` by default, `naik-kelas`, `turun-kelas`, `titip-rawat`). `createEncounterLocation` accepts a `serviceClass` option. Submitted encounters must use outpatient classes for `AMB`/`EMER` and inpatient classes for `IMP`.
- `period.end` is optional on `Encounter.period`, `statusHistory`, and `classHistory`, so an inpatient stay or an IGD visit can be sent while still ongoing. Encounters with status `finished` must close every period; this is checked on `create` and on `update` (PUT).
- New `EncounterBuilder` methods for real-time flows: `advanceStatus(status, at)`, `moveToLocation(location, at)` for room transfers and class changes, `finish(at)` (closes open status, class, location, and participant periods), and `setNovelty(...)`. `moveEncounterLocation` is also exported.
- `admitSource` and `dischargeDisposition` accept every code in the official tables, including the Kemenkes and SNOMED CT codes (previously HL7 only). New helpers: `createEncounterAdmitSource`, `createEncounterDischargeDisposition`, `createEncounterDiagnosisUse` (AD, DD, CC, CM, pre-op, post-op, billing), and `createEncounterClass`.
- Status Pengunjung, Status Kunjungan Spesialisasi, and Status Episode Pelayanan (SIRS Online): `setNovelty({ facility, specialty, episode })` and `createEncounterNoveltyExtension` with codes `new`/`returning`/`unknown`. Kemenkes has not published the extension URLs yet; the SDK uses `https://fhir.kemkes.go.id/r4/StructureDefinition/EncounterTo{Facility,Specialty,Episode}`, which must be confirmed with SATUSEHAT.
- `Encounter.extension` and `Encounter.participant.period` are accepted.
- `client.encounter.create` and `update` enforce the mandatory elements of each guide's Pendaftaran Kunjungan mapping, keyed by class: participant type (AMB, EMER) and individual (AMB, IMP); for IGD a ServiceClass extension with `reguler`; and, once `finished`, a diagnosis (all) and `hospitalization.dischargeDisposition` (AMB, EMER). Builder drafts are not checked for these (`EncounterSubmitSchema`).
- `createEmergencyEncounterHistory` and `createEncounterStatusTimeline` accept an omitted `periodEnd` to keep the last stage open.
- `npm run smoke:sandbox:write` runs `rajal`, `igd`, and `ranap` scenarios, including `serviceType`, the novelty extensions, `admitSource`, naik kelas, and `diagnosis.use`.

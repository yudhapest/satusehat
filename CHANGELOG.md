# Changelog

## 0.11.0

### Minor Changes

- af6973f: Add Pemeriksaan Fisik and IGD Triase support for Observation.

  - New `createPhysicalExamBuilder` for the physical exam mapping shared by Rawat Jalan, Rawat Inap, and Asesmen Awal IGD: tanda vital and antropometri (`buildMeasurement`, `buildMeasurements`), tingkat kesadaran (`buildConsciousness`, LOINC 67775-7), and the 28 head-to-toe items (`buildHeadToToe`, `buildHeadToToeExams`, with the guide's SNOMED CT body sites).
  - New `createEmergencyTriageBuilder` for Pengiriman Data Triase dan Gawat Darurat: sarana transportasi kedatangan (LOINC 74286-6), surat pengantar rujukan (OC000034), and kondisi pasien tiba (CTAS, LOINC 75910-0).
  - New `observation-terminology` module (`OBSERVATION_CATEGORIES`, `OBSERVATION_MEASUREMENTS`, `OBSERVATION_CONSCIOUSNESS_LEVELS`, `OBSERVATION_HEAD_TO_TOE_EXAMS`, `OBSERVATION_ARRIVAL_TRANSPORT_MODES`, `OBSERVATION_TRIAGE_LEVELS`, ...) and `LOINC_SYSTEM` / `UCUM_SYSTEM` in `common-terminology`.
  - `client.observation.create` and `update` now require `performer`, which the SATUSEHAT guides mark as mandatory (`ObservationSubmitSchema`). Builder drafts (`ObservationCreateSchema`) and reading stored observations are unaffected.
  - `Observation` accepts `partOf`, `focus`, `valueRatio`, `valueTime`, `valueDateTime`, and `valuePeriod`, which were previously dropped during validation.
  - `npm run smoke:sandbox:write` sends the full physical exam in all scenarios and the triase observations in the `igd` scenario.

- af6973f: Align Encounter with the SATUSEHAT Rawat Jalan, IGD, and Rawat Inap guides and the "Lampiran Standar Terminologi SATUSEHAT" v12.0 (31 Oktober 2026).

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

- af6973f: Add Pengiriman Data Anamnesis support for Rawat Jalan, IGD, and Rawat Inap.

  - New `FamilyMemberHistory` resource client (`client.familyMemberHistory`: create, getById, search by patient, update, patch) and schemas, used for Riwayat Penyakit Keluarga.
  - New `createAnamnesisBuilder` that builds validated payloads for keluhan utama (`chief-complaint`), keluhan penyerta (`problem-list-item`), riwayat penyakit pribadi (`previous-condition`), riwayat penyakit keluarga, riwayat alergi, and riwayat pengobatan, plus the `Encounter.diagnosis` entry with use `CC` for the keluhan utama.
  - Terminology modules with the official codes from "Lampiran Standar Terminologi SATUSEHAT" v12.0: `CONDITION_*`, `ALLERGY_INTOLERANCE_*` (including the 30 official reaction manifestations), `MEDICATION_STATEMENT_CATEGORIES`, `FAMILY_MEMBER_*`, and shared systems (`SNOMED_CT_SYSTEM`, `KEMKES_TERMINOLOGY_SYSTEM`, `KFA_SYSTEM`) in `common-terminology`.
  - `AllergyIntolerance` create and update now require `category`, `encounter`, and `recorder`, which the SATUSEHAT anamnesis guides mark as mandatory. Reading stored allergies is unaffected.
  - `MedicationStatement` accepts `contained`, so a Medication referenced as `#id` is no longer dropped during validation.
  - `AllergyIntolerance.reaction.manifestation` accepts a text-only CodeableConcept. The SATUSEHAT sandbox currently rejects every coding system there (RuleNumber 11149), and allergies stored with a text manifestation could not be read before. The anamnesis builder accepts `{ text }` manifestations.
  - `npm run smoke:sandbox:write` sends the full anamnesis in the `rajal`, `igd`, and `ranap` scenarios.

- c9d399b: Move the toolchain from Bun to Node.js and upgrade to Zod 4.

  - Require Node.js >= 24. Development uses npm, `tsx`, and the built-in `node:test` runner.
  - Upgrade `zod` to v4 so consumers on Zod 4 share a single Zod instance. Validation issue messages in `SatuSehatValidationError.issues` now use Zod 4 wording.
  - Keep UUID search parameters (`encounter`, `context`, `specimen`, `based-on`, `prescription`) accepting any hex UUID-shaped id, matching the previous behavior instead of Zod 4's stricter RFC 9562 check.
  - Export the `FetchLike` and `HeadersInit` types used by the client options.
  - Distribute builds as tarballs attached to GitHub Releases instead of publishing to npm.

- 6c59296: Accept real SATUSEHAT search and Organization responses that previously failed response validation.

  - Search bundles: SATUSEHAT mixes `OperationOutcome` entries into search results, for example results suppressed by consent rules. Any search whose bundle contained one used to fail response validation. They are now moved to a new `outcomes` field, and `entry` only holds the searched resource type. `total` still reflects the server value.
  - All 26 resource bundle schemas now share one internal search bundle helper. Export the `OperationOutcome` and `OperationOutcomeIssue` types.
  - Organization responses: `identifier` and `type` are now optional, following FHIR cardinality. Parent organizations registered by Kemenkes are returned with `identifier: []` and no `type`. `OrganizationCreateSchema` still requires both for outgoing payloads.
  - Add `npm run smoke:sandbox`, a read-only check of several resources against the SATUSEHAT sandbox.

### Patch Changes

- 9f5e099: Use HL7 CodeSystem URLs that SATUSEHAT accepts.

  - `createEncounterDiagnosis` and the encounter condition builders defaulted `Encounter.diagnosis.use` to `https://www.hl7.org/fhir/Codesystem-diagnosis-role`, which SATUSEHAT rejects with RuleNumber 10317. The default is now `http://terminology.hl7.org/CodeSystem/diagnosis-role`, so finishing an Encounter with a diagnosis works.
  - Docs and tests used `https://www.hl7.org/fhir/Codesystem-condition-ver-status` for `Condition.verificationStatus`, which SATUSEHAT rejects with RuleNumber 10170. They now use `http://terminology.hl7.org/CodeSystem/condition-ver-status`.
  - Fix the encounter queue builder docs: `encounter.update` needs the encounter `id` in the body.
  - Add `npm run smoke:sandbox:write`, which sends one outpatient visit to the sandbox and reads it back.

- 8f440bc: Fix `update` (PUT) for every resource except Encounter. The body was validated with the create schema, which has no `id` field, so the id was stripped and SATUSEHAT rejected the request ("failed to parse resource id from payload"). The transport now sets the resource id in the body after validation (new `resourceId` request option), for all 26 resource clients.

## 0.10.3

### Patch Changes

- 99f9bfb: Add Immunization resource client, schemas, documentation, and request validation for SATUSEHAT immunization submissions.

## 0.10.2

### Patch Changes

- 65b8ad5: Add typed EpisodeOfCare schemas and client endpoints for create, search, detail, update, and patch requests.

## 0.10.1

### Patch Changes

- a76e3b3: Allow Composition identifier to be parsed as either a single Identifier object or an Identifier array.

## 0.10.0

### Minor Changes

- 9cc1f87: Add first-class `carePlan` support to the SDK, including typed schemas, endpoint client methods, documentation, and test coverage for create, search, patch, and update flows.

## 0.9.0

### Minor Changes

- c206660: Add first-class `medicationStatement` support to the SDK, including typed schemas, endpoint client methods, and test coverage for create, search, patch, and update flows.

## 0.8.1

### Patch Changes

- 86c50b0: Fix Encounter update typing to require a full Encounter resource body, including `id`, for PUT requests.

## 0.8.0

### Minor Changes

- dce81a1: Add MedicationDispense client support with typed create, search, getById, patch, and update helpers.

## 0.7.3

### Patch Changes

- 74cb9e3: Relax MedicationRequest identifier validation to accept both `prescription/{organization-ihs-number}/{subsystem}` and `prescription-item/{organization-ihs-number}` systems, matching real SATUSEHAT integration variants.

## 0.7.2

### Patch Changes

- fda1bba: Handle malformed SATUSEHAT responses more safely in the shared transport layer.
  When a response is labeled as JSON but contains plain text such as `Internal Server Error`,
  the SDK now preserves the raw text in `SatuSehatApiError.response` instead of throwing a
  JSON parse error. This makes downstream app errors clearer for resources such as
  `QuestionnaireResponse`.

## 0.7.1

### Patch Changes

- c6fc9b9: Support SATUSEHAT radiology accession identifiers on `ServiceRequest` by allowing
  `identifier.system` values under `http://sys-ids.kemkes.go.id/acsn/{organization-ihs-number}`
  in addition to the existing `servicerequest` identifier. This patch also preserves
  `Identifier.type` in the shared schema so accession identifiers such as `ACSN` can
  be validated and forwarded correctly, and updates the ServiceRequest docs/tests to
  cover the radiology use case.

## 0.7.0

### Minor Changes

- 75bd027: Add more ergonomic encounter builders for staged antrean workflows.

  - allow `createEncounterBuilder(...)` to build initial `Encounter` drafts without `diagnosis`
  - add `createEncounterDiagnosis(...)` for lightweight `Encounter.diagnosis` creation from `conditionId` or `conditionReference`
  - add encounter helper shortcuts for identifier, service provider, participant, location, consultation method, and status timeline
  - add `createEncounterQueueBuilder(...)` to support staged antrean flows from `arrived` to `in-progress`, `finished`, `Condition`, and final encounter diagnosis update
  - update documentation and tests for the new encounter builder workflows

## 0.6.2

### Patch Changes

- 3f5122a: reason code on encounter resource optional

## 0.6.1

### Patch Changes

- e0468b3: fix: replace bun build with esbuild to resolve empty dist/index.js bundle — all internal modules were incorrectly marked as external, causing ReferenceError at runtime

## 0.6.0

### Minor Changes

- acda63d: Add `createEncounterMedicationRequestBuilder` for post-encounter prescribing flows, including exports, documentation, and tests.

## 0.5.0

### Minor Changes

- 53c9bf6: Add an encounter-to-medication-administration helper builder for post-encounter IGD workflows, including documentation and tests.

## 0.4.0

### Minor Changes

- 3828b14: Add `createEncounterProcedureBuilder` to support simple post-encounter IGD flows from `Encounter` to `Procedure`, including documentation, exports, and test coverage.

## 0.3.0

### Minor Changes

- ed3ffab: Add `createEncounterConditionBuilder` to support simple post-encounter IGD flows from `Encounter` to `Condition`, including helper output for `Encounter.diagnosis`.

## 0.2.0

### Minor Changes

- c07801e: Add `createEmergencyEncounterHistory` to build emergency encounter status and class history for IGD and triage flows, including transitions into inpatient care.

### Patch Changes

- a7833ae: implement Encounter resource builder and schemas for SatuSehat integration

Semua perubahan penting pada project ini akan didokumentasikan di file ini.

## 0.1.0 - 2026-04-05

### Added

- rilis publik pertama untuk package `@digitalmedika/satusehat`
- SDK TypeScript untuk SATUSEHAT API dengan validasi schema runtime dan type inference end-to-end
- dukungan OAuth2 client credentials dengan token cache in-memory dan file-based
- helper builder untuk resource klinis seperti encounter, laboratory panel, CBC panel, chest X-ray study, organization, dan risk assessment
- dukungan resource SATUSEHAT utama seperti patient, encounter, observation, diagnostic report, imaging study, medication, service request, specimen, organization, location, practitioner, dan practitioner role
- dokumentasi awal dan smoke test untuk integrasi ke environment SATUSEHAT

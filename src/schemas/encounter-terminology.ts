// SATUSEHAT terminology for the Encounter resource.
//
// Source: "Dokumen Lampiran Standar Terminologi SATUSEHAT" v12.0 (31 Oktober 2026), chapter 3
// "Resource Encounter" (section numbers are noted per table), and the SATUSEHAT FHIR R4
// Implementation Guide for the ServiceClass extension. Update the tables here when Kemenkes
// publishes a new version, so schemas, builders, and docs stay in sync.

import {
  KEMKES_CLINICAL_TERM_SYSTEM,
  KEMKES_TERMINOLOGY_SYSTEM,
  SNOMED_CT_SYSTEM,
  type TerminologyEntry,
} from "./common-terminology";

export const HL7_ACT_CODE_SYSTEM = "http://terminology.hl7.org/CodeSystem/v3-ActCode";
export const HL7_ADMIT_SOURCE_SYSTEM = "http://terminology.hl7.org/CodeSystem/admit-source";
export const HL7_DIAGNOSIS_ROLE_SYSTEM = "http://terminology.hl7.org/CodeSystem/diagnosis-role";
export const HL7_DISCHARGE_DISPOSITION_SYSTEM =
  "http://terminology.hl7.org/CodeSystem/discharge-disposition";
export const HL7_SERVICE_TYPE_SYSTEM = "http://terminology.hl7.org/CodeSystem/service-type";
export const KEMKES_DISCHARGE_DISPOSITION_SYSTEM =
  "http://terminology.kemkes.go.id/CodeSystem/discharge-disposition";
export const ENCOUNTER_OUTPATIENT_SERVICE_CLASS_SYSTEM =
  "http://terminology.kemkes.go.id/CodeSystem/locationServiceClass-Outpatient";
export const ENCOUNTER_INPATIENT_SERVICE_CLASS_SYSTEM =
  "http://terminology.kemkes.go.id/CodeSystem/locationServiceClass-Inpatient";
export const ENCOUNTER_UPGRADE_CLASS_SYSTEM =
  "http://terminology.kemkes.go.id/CodeSystem/locationUpgradeClass";
export const ENCOUNTER_NOVELTY_SYSTEM =
  "http://terminology.kemkes.go.id/CodeSystem/encounter-novelty";

// Extension on Encounter.location (SATUSEHAT FHIR R4 Implementation Guide, ServiceClass).
export const ENCOUNTER_SERVICE_CLASS_EXTENSION_URL =
  "https://fhir.kemkes.go.id/r4/StructureDefinition/ServiceClass";

// Encounter.extension for SIRS Online reporting (section 3.22-3.24). The codes are official; the
// extension URLs are not published by Kemenkes yet. These follow the naming of the published
// SATUSEHAT extensions (for example ServiceClass) and must be confirmed with SATUSEHAT.
export const ENCOUNTER_NOVELTY_EXTENSION_URLS = {
  facility: "https://fhir.kemkes.go.id/r4/StructureDefinition/EncounterToFacility",
  specialty: "https://fhir.kemkes.go.id/r4/StructureDefinition/EncounterToSpecialty",
  episode: "https://fhir.kemkes.go.id/r4/StructureDefinition/EncounterToEpisode",
} as const;

// 3.4 Encounter.class
export const ENCOUNTER_CLASSES = {
  AMB: { system: HL7_ACT_CODE_SYSTEM, display: "ambulatory" },
  EMER: { system: HL7_ACT_CODE_SYSTEM, display: "emergency" },
  FLD: { system: HL7_ACT_CODE_SYSTEM, display: "field" },
  HH: { system: HL7_ACT_CODE_SYSTEM, display: "home health" },
  IMP: { system: HL7_ACT_CODE_SYSTEM, display: "inpatient encounter" },
  ACUTE: { system: HL7_ACT_CODE_SYSTEM, display: "inpatient acute" },
  NONAC: { system: HL7_ACT_CODE_SYSTEM, display: "inpatient non-acute" },
  OBSENC: { system: HL7_ACT_CODE_SYSTEM, display: "observation encounter" },
  PRENC: { system: HL7_ACT_CODE_SYSTEM, display: "pre-admission" },
  SS: { system: HL7_ACT_CODE_SYSTEM, display: "short stay" },
  VR: { system: HL7_ACT_CODE_SYSTEM, display: "virtual" },
  "referred-procedure": {
    system: "http://terminology.kemkes.go.id/CodeSystem/encounter-class",
    display: "Prosedur yang Dirujuk",
  },
} as const satisfies Record<string, TerminologyEntry>;

// 3.14 Encounter.location.extension:serviceClass.value, rawat jalan and IGD.
export const ENCOUNTER_OUTPATIENT_SERVICE_CLASSES = {
  reguler: { system: ENCOUNTER_OUTPATIENT_SERVICE_CLASS_SYSTEM, display: "Kelas Reguler" },
  eksekutif: { system: ENCOUNTER_OUTPATIENT_SERVICE_CLASS_SYSTEM, display: "Kelas Eksekutif" },
} as const satisfies Record<string, TerminologyEntry>;

// 3.14 Encounter.location.extension:serviceClass.value, rawat inap (including KRIS).
export const ENCOUNTER_INPATIENT_SERVICE_CLASSES = {
  "1": { system: ENCOUNTER_INPATIENT_SERVICE_CLASS_SYSTEM, display: "Kelas 1" },
  "2": { system: ENCOUNTER_INPATIENT_SERVICE_CLASS_SYSTEM, display: "Kelas 2" },
  "3": { system: ENCOUNTER_INPATIENT_SERVICE_CLASS_SYSTEM, display: "Kelas 3" },
  vip: { system: ENCOUNTER_INPATIENT_SERVICE_CLASS_SYSTEM, display: "Kelas VIP" },
  vvip: { system: ENCOUNTER_INPATIENT_SERVICE_CLASS_SYSTEM, display: "Kelas VVIP" },
  "kris-a": { system: KEMKES_TERMINOLOGY_SYSTEM, display: "KRIS A" },
  "kris-b": { system: KEMKES_TERMINOLOGY_SYSTEM, display: "KRIS B" },
  "kris-c": { system: KEMKES_TERMINOLOGY_SYSTEM, display: "KRIS C" },
} as const satisfies Record<string, TerminologyEntry>;

// 3.15 Encounter.location.extension:serviceClass.upgradeClassIndicator
export const ENCOUNTER_UPGRADE_CLASSES = {
  "kelas-tetap": { system: ENCOUNTER_UPGRADE_CLASS_SYSTEM, display: "Kelas Tetap Perawatan" },
  "naik-kelas": { system: ENCOUNTER_UPGRADE_CLASS_SYSTEM, display: "Kenaikan Kelas Perawatan" },
  "turun-kelas": { system: ENCOUNTER_UPGRADE_CLASS_SYSTEM, display: "Penurunan Kelas Perawatan" },
  "titip-rawat": { system: ENCOUNTER_UPGRADE_CLASS_SYSTEM, display: "Titip Kelas Perawatan" },
} as const satisfies Record<string, TerminologyEntry>;

// 3.9 Encounter.hospitalization.admitSource
export const ENCOUNTER_ADMIT_SOURCES = {
  "hosp-trans": { system: HL7_ADMIT_SOURCE_SYSTEM, display: "Transferred from other hospital" },
  emd: { system: HL7_ADMIT_SOURCE_SYSTEM, display: "From accident/emergency department" },
  outp: { system: HL7_ADMIT_SOURCE_SYSTEM, display: "From outpatient department" },
  born: { system: HL7_ADMIT_SOURCE_SYSTEM, display: "Born in hospital" },
  gp: { system: HL7_ADMIT_SOURCE_SYSTEM, display: "General Practitioner referral" },
  mp: { system: HL7_ADMIT_SOURCE_SYSTEM, display: "Medical Practitioner/physician referral" },
  nursing: { system: HL7_ADMIT_SOURCE_SYSTEM, display: "From nursing home" },
  psych: { system: HL7_ADMIT_SOURCE_SYSTEM, display: "From psychiatric hospital" },
  rehab: { system: HL7_ADMIT_SOURCE_SYSTEM, display: "From rehabilitation facility" },
  other: { system: HL7_ADMIT_SOURCE_SYSTEM, display: "Other" },
  TK000031: { system: KEMKES_TERMINOLOGY_SYSTEM, display: "Rujukan Poli" },
  EHA000001: { system: KEMKES_CLINICAL_TERM_SYSTEM, display: "Kader/ Komunitas" },
  TK000033: { system: KEMKES_TERMINOLOGY_SYSTEM, display: "LSM" },
  "225323000": { system: SNOMED_CT_SYSTEM, display: "Smoking cessation education" },
  TK000070: { system: KEMKES_TERMINOLOGY_SYSTEM, display: "Posyandu" },
  "1991000124105": { system: SNOMED_CT_SYSTEM, display: "Referred by self" },
} as const satisfies Record<string, TerminologyEntry>;

// 3.13 Encounter.hospitalization.dischargeDisposition
export const ENCOUNTER_DISCHARGE_DISPOSITIONS = {
  home: { system: HL7_DISCHARGE_DISPOSITION_SYSTEM, display: "Home" },
  "alt-home": { system: HL7_DISCHARGE_DISPOSITION_SYSTEM, display: "Alternative home" },
  "other-hcf": { system: HL7_DISCHARGE_DISPOSITION_SYSTEM, display: "Other healthcare facility" },
  hosp: { system: HL7_DISCHARGE_DISPOSITION_SYSTEM, display: "Hospice" },
  long: { system: HL7_DISCHARGE_DISPOSITION_SYSTEM, display: "Long-term care" },
  aadvice: { system: HL7_DISCHARGE_DISPOSITION_SYSTEM, display: "Left against advice" },
  exp: { system: HL7_DISCHARGE_DISPOSITION_SYSTEM, display: "Expired" },
  psy: { system: HL7_DISCHARGE_DISPOSITION_SYSTEM, display: "Psychiatric hospital" },
  rehab: { system: HL7_DISCHARGE_DISPOSITION_SYSTEM, display: "Rehabilitation" },
  snf: { system: HL7_DISCHARGE_DISPOSITION_SYSTEM, display: "Skilled nursing facility" },
  oth: { system: HL7_DISCHARGE_DISPOSITION_SYSTEM, display: "Other" },
  "exp-lt48h": { system: KEMKES_DISCHARGE_DISPOSITION_SYSTEM, display: "Meninggal < 48 jam" },
  "exp-gt48h": { system: KEMKES_DISCHARGE_DISPOSITION_SYSTEM, display: "Meninggal > 48 jam" },
  "416462003": { system: SNOMED_CT_SYSTEM, display: "Wound" },
  TK000323: { system: KEMKES_TERMINOLOGY_SYSTEM, display: "False emergency" },
} as const satisfies Record<string, TerminologyEntry>;

// 3.18 Encounter.diagnosis.use
export const ENCOUNTER_DIAGNOSIS_USES = {
  AD: { system: HL7_DIAGNOSIS_ROLE_SYSTEM, display: "Admission diagnosis" },
  DD: { system: HL7_DIAGNOSIS_ROLE_SYSTEM, display: "Discharge diagnosis" },
  CC: { system: HL7_DIAGNOSIS_ROLE_SYSTEM, display: "Chief complaint" },
  CM: { system: HL7_DIAGNOSIS_ROLE_SYSTEM, display: "Comorbidity diagnosis" },
  "pre-op": { system: HL7_DIAGNOSIS_ROLE_SYSTEM, display: "pre-op diagnosis" },
  "post-op": { system: HL7_DIAGNOSIS_ROLE_SYSTEM, display: "post-op diagnosis" },
  billing: { system: HL7_DIAGNOSIS_ROLE_SYSTEM, display: "Billing" },
} as const satisfies Record<string, TerminologyEntry>;

// 3.22-3.24 Status Pengunjung, Status Kunjungan Spesialisasi, Status Episode Pelayanan.
export const ENCOUNTER_NOVELTY_CODES = {
  new: { system: ENCOUNTER_NOVELTY_SYSTEM, display: "New" },
  returning: { system: ENCOUNTER_NOVELTY_SYSTEM, display: "Returning" },
  unknown: { system: ENCOUNTER_NOVELTY_SYSTEM, display: "Unknown" },
} as const satisfies Record<string, TerminologyEntry>;

export type EncounterClassCode = keyof typeof ENCOUNTER_CLASSES;
export type EncounterOutpatientServiceClass = keyof typeof ENCOUNTER_OUTPATIENT_SERVICE_CLASSES;
export type EncounterInpatientServiceClass = keyof typeof ENCOUNTER_INPATIENT_SERVICE_CLASSES;
export type EncounterUpgradeClass = keyof typeof ENCOUNTER_UPGRADE_CLASSES;
export type EncounterAdmitSourceCode = keyof typeof ENCOUNTER_ADMIT_SOURCES;
export type EncounterDischargeDispositionCode = keyof typeof ENCOUNTER_DISCHARGE_DISPOSITIONS;
export type EncounterDiagnosisUseCode = keyof typeof ENCOUNTER_DIAGNOSIS_USES;
export type EncounterNoveltyCode = keyof typeof ENCOUNTER_NOVELTY_CODES;
export type EncounterNoveltyKind = keyof typeof ENCOUNTER_NOVELTY_EXTENSION_URLS;

/** Code systems allowed for each coded element, derived from the tables above. */
const systemsOf = (table: Record<string, TerminologyEntry>) =>
  [...new Set(Object.values(table).map((entry) => entry.system))] as [string, ...string[]];

export const ENCOUNTER_SERVICE_CLASS_SYSTEMS = systemsOf({
  ...ENCOUNTER_OUTPATIENT_SERVICE_CLASSES,
  ...ENCOUNTER_INPATIENT_SERVICE_CLASSES,
});
export const ENCOUNTER_ADMIT_SOURCE_SYSTEMS = systemsOf(ENCOUNTER_ADMIT_SOURCES);
export const ENCOUNTER_DISCHARGE_DISPOSITION_SYSTEMS = systemsOf(ENCOUNTER_DISCHARGE_DISPOSITIONS);

// SATUSEHAT terminology for Condition (Lampiran Standar Terminologi v12.0, chapter 10).

import { KEMKES_TERMINOLOGY_SYSTEM, type TerminologyEntry } from "./common-terminology";

export const CONDITION_CLINICAL_STATUS_SYSTEM =
  "http://terminology.hl7.org/CodeSystem/condition-clinical";
export const CONDITION_VERIFICATION_STATUS_SYSTEM =
  "http://terminology.hl7.org/CodeSystem/condition-ver-status";
export const CONDITION_CATEGORY_SYSTEM = "http://terminology.hl7.org/CodeSystem/condition-category";

// 10.1 Condition.clinicalStatus
export const CONDITION_CLINICAL_STATUSES = {
  active: { system: CONDITION_CLINICAL_STATUS_SYSTEM, display: "Active" },
  recurrence: { system: CONDITION_CLINICAL_STATUS_SYSTEM, display: "Recurrence" },
  relapse: { system: CONDITION_CLINICAL_STATUS_SYSTEM, display: "Relapse" },
  inactive: { system: CONDITION_CLINICAL_STATUS_SYSTEM, display: "Inactive" },
  remission: { system: CONDITION_CLINICAL_STATUS_SYSTEM, display: "Remission" },
  resolved: { system: CONDITION_CLINICAL_STATUS_SYSTEM, display: "Resolved" },
} as const satisfies Record<string, TerminologyEntry>;

// 10.2 Condition.verificationStatus
export const CONDITION_VERIFICATION_STATUSES = {
  unconfirmed: { system: CONDITION_VERIFICATION_STATUS_SYSTEM, display: "Unconfirmed" },
  provisional: { system: CONDITION_VERIFICATION_STATUS_SYSTEM, display: "Provisional" },
  differential: { system: CONDITION_VERIFICATION_STATUS_SYSTEM, display: "Differential" },
  confirmed: { system: CONDITION_VERIFICATION_STATUS_SYSTEM, display: "Confirmed" },
  refuted: { system: CONDITION_VERIFICATION_STATUS_SYSTEM, display: "Refuted" },
} as const satisfies Record<string, TerminologyEntry>;

// 10.3 Condition.category. Anamnesis uses chief-complaint (keluhan utama), problem-list-item
// (keluhan penyerta), and previous-condition (riwayat penyakit pribadi).
export const CONDITION_CATEGORIES = {
  "problem-list-item": { system: CONDITION_CATEGORY_SYSTEM, display: "Problem List Item" },
  "encounter-diagnosis": { system: CONDITION_CATEGORY_SYSTEM, display: "Encounter Diagnosis" },
  "chief-complaint": { system: KEMKES_TERMINOLOGY_SYSTEM, display: "Chief Complaint" },
  "previous-condition": { system: KEMKES_TERMINOLOGY_SYSTEM, display: "Previous Condition" },
} as const satisfies Record<string, TerminologyEntry>;

export type ConditionClinicalStatusCode = keyof typeof CONDITION_CLINICAL_STATUSES;
export type ConditionVerificationStatusCode = keyof typeof CONDITION_VERIFICATION_STATUSES;
export type ConditionCategoryCode = keyof typeof CONDITION_CATEGORIES;

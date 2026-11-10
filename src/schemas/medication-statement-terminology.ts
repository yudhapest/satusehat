// SATUSEHAT terminology for MedicationStatement (Lampiran Standar Terminologi v12.0, chapter 20).
//
// MedicationStatement.medicationCodeableConcept (20.2) uses KFA codes (KFA_SYSTEM): 93xxxxxx when the
// brand is known, 92xxxxxx when only the generic product is known.

import type { TerminologyEntry } from "./common-terminology";

export const MEDICATION_STATEMENT_CATEGORY_SYSTEM =
  "http://terminology.hl7.org/CodeSystem/medication-statement-category";

// 20.3 MedicationStatement.category
export const MEDICATION_STATEMENT_CATEGORIES = {
  inpatient: { system: MEDICATION_STATEMENT_CATEGORY_SYSTEM, display: "Inpatient" },
  outpatient: { system: MEDICATION_STATEMENT_CATEGORY_SYSTEM, display: "Outpatient" },
  community: { system: MEDICATION_STATEMENT_CATEGORY_SYSTEM, display: "Community" },
} as const satisfies Record<string, TerminologyEntry>;

export type MedicationStatementCategoryCode = keyof typeof MEDICATION_STATEMENT_CATEGORIES;

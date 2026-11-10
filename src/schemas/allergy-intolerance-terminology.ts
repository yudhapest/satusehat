// SATUSEHAT terminology for AllergyIntolerance (Lampiran Standar Terminologi v12.0, chapter 4).
//
// AllergyIntolerance.code (4.6): KFA for drugs and vaccines, WHO ATC level 3/4 for drug classes,
// and SNOMED CT for food, environment, and "no known allergy" (for example 716186003).

import { SNOMED_CT_SYSTEM, type TerminologyEntry } from "./common-terminology";

export const ALLERGY_INTOLERANCE_CLINICAL_STATUS_SYSTEM =
  "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical";
export const ALLERGY_INTOLERANCE_VERIFICATION_STATUS_SYSTEM =
  "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification";

// 4.1 AllergyIntolerance.clinicalStatus
export const ALLERGY_INTOLERANCE_CLINICAL_STATUSES = {
  active: { system: ALLERGY_INTOLERANCE_CLINICAL_STATUS_SYSTEM, display: "Active" },
  inactive: { system: ALLERGY_INTOLERANCE_CLINICAL_STATUS_SYSTEM, display: "Inactive" },
  resolved: { system: ALLERGY_INTOLERANCE_CLINICAL_STATUS_SYSTEM, display: "Resolved" },
} as const satisfies Record<string, TerminologyEntry>;

// 4.2 AllergyIntolerance.verificationStatus
export const ALLERGY_INTOLERANCE_VERIFICATION_STATUSES = {
  unconfirmed: { system: ALLERGY_INTOLERANCE_VERIFICATION_STATUS_SYSTEM, display: "Unconfirmed" },
  confirmed: { system: ALLERGY_INTOLERANCE_VERIFICATION_STATUS_SYSTEM, display: "Confirmed" },
  refuted: { system: ALLERGY_INTOLERANCE_VERIFICATION_STATUS_SYSTEM, display: "Refuted" },
  "entered-in-error": {
    system: ALLERGY_INTOLERANCE_VERIFICATION_STATUS_SYSTEM,
    display: "Entered in Error",
  },
} as const satisfies Record<string, TerminologyEntry>;

// 4.8 AllergyIntolerance.reaction.manifestation
export const ALLERGY_INTOLERANCE_REACTION_MANIFESTATIONS = {
  "1985008": { system: SNOMED_CT_SYSTEM, display: "Vomitus" },
  "4386001": { system: SNOMED_CT_SYSTEM, display: "Bronchospasm" },
  "9826008": { system: SNOMED_CT_SYSTEM, display: "Conjunctivitis" },
  "23924001": { system: SNOMED_CT_SYSTEM, display: "Tight chest" },
  "24079001": { system: SNOMED_CT_SYSTEM, display: "Atopic dermatitis" },
  "31996006": { system: SNOMED_CT_SYSTEM, display: "Vasculitis" },
  "39579001": { system: SNOMED_CT_SYSTEM, display: "Anaphylaxis" },
  "41291007": { system: SNOMED_CT_SYSTEM, display: "Angioedema" },
  "43116000": { system: SNOMED_CT_SYSTEM, display: "Eczema" },
  "49727002": { system: SNOMED_CT_SYSTEM, display: "Cough" },
  "51599000": { system: SNOMED_CT_SYSTEM, display: "Edema of larynx" },
  "62315008": { system: SNOMED_CT_SYSTEM, display: "Diarrhea" },
  "70076002": { system: SNOMED_CT_SYSTEM, display: "Rhinitis" },
  "73442001": { system: SNOMED_CT_SYSTEM, display: "Stevens-Johnson syndrome" },
  "76067001": { system: SNOMED_CT_SYSTEM, display: "Sneezing" },
  "91175000": { system: SNOMED_CT_SYSTEM, display: "Seizure" },
  "126485001": { system: SNOMED_CT_SYSTEM, display: "Urticaria" },
  "162290004": { system: SNOMED_CT_SYSTEM, display: "Dry eyes" },
  "195967001": { system: SNOMED_CT_SYSTEM, display: "Asthma" },
  "247472004": { system: SNOMED_CT_SYSTEM, display: "Wheal" },
  "267036007": { system: SNOMED_CT_SYSTEM, display: "Dyspnea" },
  "271757001": { system: SNOMED_CT_SYSTEM, display: "Papular eruption" },
  "271759003": { system: SNOMED_CT_SYSTEM, display: "Bullous eruption" },
  "271807003": { system: SNOMED_CT_SYSTEM, display: "Eruption of skin" },
  "410430005": { system: SNOMED_CT_SYSTEM, display: "Cardiorespiratory arrest" },
  "418363000": { system: SNOMED_CT_SYSTEM, display: "Itching of skin" },
  "422587007": { system: SNOMED_CT_SYSTEM, display: "Nausea" },
  "698247007": { system: SNOMED_CT_SYSTEM, display: "Cardiac arrhythmia" },
  "702809001": {
    system: SNOMED_CT_SYSTEM,
    display: "Drug reaction with eosinophilia and systemic symptoms",
  },
  "768962006": { system: SNOMED_CT_SYSTEM, display: "Lyell syndrome" },
} as const satisfies Record<string, TerminologyEntry>;

export type AllergyIntoleranceClinicalStatusCode =
  keyof typeof ALLERGY_INTOLERANCE_CLINICAL_STATUSES;
export type AllergyIntoleranceVerificationStatusCode =
  keyof typeof ALLERGY_INTOLERANCE_VERIFICATION_STATUSES;
export type AllergyIntoleranceReactionManifestationCode =
  keyof typeof ALLERGY_INTOLERANCE_REACTION_MANIFESTATIONS;

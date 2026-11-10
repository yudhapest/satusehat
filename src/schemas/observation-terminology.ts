// SATUSEHAT terminology for Observation.
//
// Sources: "Pengiriman Data Hasil Pemeriksaan Fisik" in the Rawat Jalan (v7.0) and Rawat Inap
// (v6.0) guides and "Asesmen Awal IGD" in the IGD guide (v5.2), which share the same mapping;
// "Pengiriman Data Triase dan Gawat Darurat" in the IGD guide; and Lampiran Standar Terminologi
// SATUSEHAT v12.0 chapter 5 (Observation.category).

import {
  KEMKES_CLINICAL_TERM_SYSTEM,
  LOINC_SYSTEM,
  SNOMED_CT_SYSTEM,
  type TerminologyEntry,
} from "./common-terminology";

export const OBSERVATION_CATEGORY_SYSTEM =
  "http://terminology.hl7.org/CodeSystem/observation-category";

// 5.2 Observation.category
export const OBSERVATION_CATEGORIES = {
  "social-history": { system: OBSERVATION_CATEGORY_SYSTEM, display: "Social History" },
  "vital-signs": { system: OBSERVATION_CATEGORY_SYSTEM, display: "Vital Signs" },
  imaging: { system: OBSERVATION_CATEGORY_SYSTEM, display: "Imaging" },
  laboratory: { system: OBSERVATION_CATEGORY_SYSTEM, display: "Laboratory" },
  procedure: { system: OBSERVATION_CATEGORY_SYSTEM, display: "Procedure" },
  survey: { system: OBSERVATION_CATEGORY_SYSTEM, display: "Survey" },
  exam: { system: OBSERVATION_CATEGORY_SYSTEM, display: "Exam" },
  therapy: { system: OBSERVATION_CATEGORY_SYSTEM, display: "Therapy" },
  activity: { system: OBSERVATION_CATEGORY_SYSTEM, display: "Activity" },
} as const satisfies Record<string, TerminologyEntry>;

export interface ObservationMeasurementDefinition {
  readonly code: string;
  readonly display: string;
  /** Observation.valueQuantity.unit */
  readonly unit: string;
  /** Observation.valueQuantity.code (UCUM) */
  readonly ucum: string;
}

// Tanda vital and antropometri (category vital-signs, valueQuantity).
export const OBSERVATION_MEASUREMENTS = {
  "denyut-jantung": { code: "8867-4", display: "Heart rate", unit: "beats/min", ucum: "/min" },
  pernapasan: { code: "9279-1", display: "Respiratory rate", unit: "breaths/min", ucum: "/min" },
  sistole: {
    code: "8480-6",
    display: "Systolic blood pressure",
    unit: "mm[Hg]",
    ucum: "mm[Hg]",
  },
  diastole: {
    code: "8462-4",
    display: "Diastolic blood pressure",
    unit: "mm[Hg]",
    ucum: "mm[Hg]",
  },
  // The guides print unit "C" with UCUM code "Cel".
  "suhu-tubuh": { code: "8310-5", display: "Body temperature", unit: "C", ucum: "Cel" },
  "tinggi-badan": { code: "8302-2", display: "Body height", unit: "cm", ucum: "cm" },
  "berat-badan": { code: "29463-7", display: "Body weight", unit: "kg", ucum: "kg" },
  // Luas permukaan tubuh untuk anak-anak. The guides print "m²"; the UCUM code is "m2".
  "luas-permukaan-tubuh": { code: "8277-6", display: "Body surface area", unit: "m2", ucum: "m2" },
} as const satisfies Record<string, ObservationMeasurementDefinition>;

// Tingkat kesadaran: Observation.code LOINC 67775-7 (category exam), valueCodeableConcept.
export const OBSERVATION_CONSCIOUSNESS_CODE = {
  code: "67775-7",
  display: "Level of responsiveness",
};

export const OBSERVATION_CONSCIOUSNESS_LEVELS = {
  "248234008": { system: SNOMED_CT_SYSTEM, display: "Mentally alert" },
  "300202002": { system: SNOMED_CT_SYSTEM, display: "Response to voice" },
  "450847001": { system: SNOMED_CT_SYSTEM, display: "Responds to pain" },
  "422768004": { system: SNOMED_CT_SYSTEM, display: "Unresponsive" },
  "130987000": { system: SNOMED_CT_SYSTEM, display: "Acute confusion" },
  "2776000": { system: SNOMED_CT_SYSTEM, display: "Delirium" },
} as const satisfies Record<string, TerminologyEntry>;

export interface ObservationHeadToToeDefinition {
  readonly code: string;
  readonly display: string;
  /** Observation.bodySite (SNOMED CT), when the guides add one */
  readonly bodySite?: { readonly code: string; readonly display: string };
}

// Pemeriksaan fisik head to toe: category exam, LOINC narrative code, valueString.
export const OBSERVATION_HEAD_TO_TOE_EXAMS = {
  kepala: { code: "10199-8", display: "Physical findings of Head Narrative" },
  mata: { code: "10197-2", display: "Physical findings of Eye Narrative" },
  telinga: { code: "10195-6", display: "Physical findings of Ear Narrative" },
  hidung: { code: "10203-8", display: "Physical findings of Nose Narrative" },
  rambut: { code: "32436-8", display: "Physical findings of Hair" },
  bibir: { code: "32446-7", display: "Physical findings of Lip" },
  "gigi-geligi": { code: "85910-8", display: "Physical findings of Teeth and Gum Narrative" },
  lidah: { code: "32483-0", display: "Physical findings of Tongue" },
  "langit-langit": {
    code: "10201-2",
    display: "Physical findings of Mouth and Throat and Teeth Narrative",
    bodySite: { code: "72914001", display: "Palatal structure" },
  },
  leher: { code: "11411-6", display: "Physical findings of Neck Narrative" },
  tenggorokan: { code: "56867-5", display: "Physical findings of Throat Narrative" },
  tonsil: {
    code: "10201-2",
    display: "Physical findings of Mouth and Throat and Teeth Narrative",
    bodySite: { code: "91636008", display: "Bilateral palatine tonsils" },
  },
  dada: { code: "11391-0", display: "Physical findings of Chest Narrative" },
  payudara: { code: "10193-1", display: "Physical findings of Breasts Narrative" },
  punggung: { code: "10192-3", display: "Physical findings of Back Narrative" },
  perut: { code: "10191-5", display: "Physical findings of Abdomen Narrative" },
  genital: { code: "11400-9", display: "Physical findings of Genitalia Narrative" },
  "anus-dubur": {
    code: "11388-6",
    display: "Physical findings of Buttocks Narrative",
    bodySite: { code: "53505006", display: "Anal structure" },
  },
  "lengan-atas": { code: "11386-0", display: "Physical findings of Upper Arm Narrative" },
  "lengan-bawah": { code: "11398-5", display: "Physical findings of Forearm Narrative" },
  "jari-tangan": {
    code: "11404-1",
    display: "Physical findings of Hand Narrative",
    bodySite: { code: "7569003", display: "Finger structure" },
  },
  "kuku-tangan": {
    code: "32456-6",
    display: "Physical findings of Nail",
    bodySite: { code: "770812000", display: "Entire nail unit of finger" },
  },
  "persendian-tangan": { code: "11415-7", display: "Physical findings of Wrist Narrative" },
  "tungkai-atas": { code: "11414-0", display: "Physical findings of Thigh Narrative" },
  "tungkai-bawah": { code: "11389-4", display: "Physical findings of Calf Narrative" },
  "jari-kaki": {
    code: "11397-7",
    display: "Physical findings of Foot Narrative",
    bodySite: { code: "29707007", display: "Toe structure" },
  },
  "kuku-kaki": {
    code: "32456-6",
    display: "Physical findings of Nail",
    bodySite: { code: "770805009", display: "Structure of nail unit of toe" },
  },
  "persendian-kaki": {
    code: "11385-2",
    display: "Physical findings of Ankle Narrative",
    bodySite: { code: "26552008", display: "Foot joint structure" },
  },
} as const satisfies Record<string, ObservationHeadToToeDefinition>;

// IGD triase (category survey).
export const OBSERVATION_ARRIVAL_TRANSPORT_CODE = {
  code: "74286-6",
  display: "Transport mode to hospital",
};

export const OBSERVATION_ARRIVAL_TRANSPORT_MODES = {
  ambulans: { system: LOINC_SYSTEM, code: "LA9315-8", display: "Ground ambulance" },
  mobil: { system: SNOMED_CT_SYSTEM, code: "71783008", display: "Car" },
  motor: { system: SNOMED_CT_SYSTEM, code: "90748009", display: "Motorcycle" },
  "lain-lain": { system: LOINC_SYSTEM, code: "LA46-8", display: "Other" },
} as const;

export const OBSERVATION_REFERRAL_LETTER_CODE = {
  system: KEMKES_CLINICAL_TERM_SYSTEM,
  code: "OC000034",
  display: "Surat Pengantar Rujukan",
} as const;

export const OBSERVATION_TRIAGE_CODE = {
  code: "75910-0",
  display: "Canadian triage and acuity scale [CTAS]",
};

// Kondisi pasien tiba (CTAS).
export const OBSERVATION_TRIAGE_LEVELS = {
  resusitasi: { system: LOINC_SYSTEM, code: "LA6112-2", display: "1" },
  emergensi: { system: LOINC_SYSTEM, code: "LA6113-0", display: "2" },
  urgent: { system: LOINC_SYSTEM, code: "LA6114-8", display: "3" },
  "less-urgent": { system: LOINC_SYSTEM, code: "LA6115-5", display: "4" },
  "non-urgent": { system: LOINC_SYSTEM, code: "LA10137-0", display: "5" },
  "death-on-arrival": {
    system: SNOMED_CT_SYSTEM,
    code: "63238001",
    display: "Dead on arrival at hospital",
  },
} as const;

export type ObservationCategoryCode = keyof typeof OBSERVATION_CATEGORIES;
export type ObservationMeasurement = keyof typeof OBSERVATION_MEASUREMENTS;
export type ObservationConsciousnessLevel = keyof typeof OBSERVATION_CONSCIOUSNESS_LEVELS;
export type ObservationHeadToToeSite = keyof typeof OBSERVATION_HEAD_TO_TOE_EXAMS;
export type ObservationArrivalTransportMode = keyof typeof OBSERVATION_ARRIVAL_TRANSPORT_MODES;
export type ObservationTriageLevel = keyof typeof OBSERVATION_TRIAGE_LEVELS;

// Code systems shared by several SATUSEHAT resources.
// Source: "Dokumen Lampiran Standar Terminologi SATUSEHAT" v12.0 (31 Oktober 2026).

export const SNOMED_CT_SYSTEM = "http://snomed.info/sct";
export const LOINC_SYSTEM = "http://loinc.org";
export const UCUM_SYSTEM = "http://unitsofmeasure.org";
export const KEMKES_TERMINOLOGY_SYSTEM = "http://terminology.kemkes.go.id";
export const KEMKES_CLINICAL_TERM_SYSTEM =
  "http://terminology.kemkes.go.id/CodeSystem/clinical-term";
// Kamus Farmasi dan Alat Kesehatan: 92xxxxxx (produk virtual/template), 93xxxxxx (produk aktual).
export const KFA_SYSTEM = "http://sys-ids.kemkes.go.id/kfa";

export interface TerminologyEntry {
  readonly system: string;
  readonly display: string;
}

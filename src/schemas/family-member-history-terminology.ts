// SATUSEHAT terminology for FamilyMemberHistory (Lampiran Standar Terminologi v12.0, chapter 29)
// and the Riwayat Penyakit Keluarga mapping in the Rawat Jalan, IGD, and Rawat Inap guides.
//
// FamilyMemberHistory.condition.code uses SNOMED CT (<< 416471007 Family history of clinical
// finding, or << 160266009 No family history of clinical finding) or the Kemenkes codes below.

import { KEMKES_TERMINOLOGY_SYSTEM, type TerminologyEntry } from "./common-terminology";

export const FAMILY_MEMBER_RELATIONSHIP_SYSTEM =
  "http://terminology.hl7.org/CodeSystem/v3-RoleCode";

// FamilyMemberHistory.relationship used by the anamnesis guides.
export const FAMILY_MEMBER_RELATIONSHIPS = {
  FAMMEMB: { system: FAMILY_MEMBER_RELATIONSHIP_SYSTEM, display: "Family member" },
} as const satisfies Record<string, TerminologyEntry>;

// 29.3 FamilyMemberHistory.condition.code (Kemenkes codes).
export const FAMILY_MEMBER_HISTORY_CONDITIONS = {
  TK000317: {
    system: KEMKES_TERMINOLOGY_SYSTEM,
    display: "Riwayat keluarga penyakit jantung iskemik pada laki-laki usia <=45 tahun",
  },
  TK000318: {
    system: KEMKES_TERMINOLOGY_SYSTEM,
    display: "Riwayat keluarga penyakit jantung iskemik pada perempuan usia <=55 tahun",
  },
} as const satisfies Record<string, TerminologyEntry>;

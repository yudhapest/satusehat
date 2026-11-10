import { describe, test } from "node:test";

import {
  ALLERGY_INTOLERANCE_REACTION_MANIFESTATIONS,
  CONDITION_CATEGORIES,
  createAnamnesisBuilder,
  createSatuSehatClient,
  SatuSehatValidationError,
} from "../src";
import {
  AllergyIntoleranceCreateSchema,
  AllergyIntoleranceSchema,
} from "../src/schemas/allergy-intolerance";
import { FamilyMemberHistoryCreateSchema } from "../src/schemas/family-member-history";
import { MedicationStatementCreateSchema } from "../src/schemas/medication-statement";
import { expect } from "./helpers/expect";

const context = {
  subject: { reference: "Patient/P02478375538", display: "Budi Santoso" },
  encounter: { reference: "Encounter/2b2d0a3e-082a-4fe9-ae13-da9c3b5e422f" },
  recorder: { reference: "Practitioner/N10000001", display: "Dokter Bronsig" },
  recordedDate: "2026-11-10T01:00:00+00:00",
};

describe("anamnesis: keluhan utama, keluhan penyerta, riwayat penyakit pribadi", () => {
  test("builds keluhan utama with the Kemenkes chief-complaint category", () => {
    const condition = createAnamnesisBuilder(context).buildChiefComplaint({
      code: { code: "386661006", display: "Fever" },
      onsetDateTime: "2026-11-08T01:00:00+00:00",
    });

    expect(condition.category?.[0]?.coding[0]).toEqual({
      system: "http://terminology.kemkes.go.id",
      code: "chief-complaint",
      display: "Chief Complaint",
    });
    expect(condition.code.coding[0]).toEqual({
      system: "http://snomed.info/sct",
      code: "386661006",
      display: "Fever",
    });
    expect(condition.subject).toEqual(context.subject);
    expect(condition.encounter).toEqual(context.encounter);
    expect(condition.onsetDateTime).toBe("2026-11-08T01:00:00+00:00");
    expect(condition.recorder).toEqual(context.recorder);
  });

  test("links keluhan utama to the Encounter with diagnosis use CC", () => {
    const diagnosis = createAnamnesisBuilder(context).buildChiefComplaintDiagnosis("cond-cc-1");

    expect(diagnosis).toEqual({
      condition: { reference: "Condition/cond-cc-1" },
      use: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/diagnosis-role",
            code: "CC",
            display: "Chief complaint",
          },
        ],
      },
      rank: 1,
    });
  });

  test("builds keluhan penyerta with the HL7 problem-list-item category", () => {
    const condition = createAnamnesisBuilder(context).buildAccompanyingComplaint({
      code: { code: "25064002", display: "Headache" },
    });

    expect(condition.category?.[0]?.coding[0]).toEqual({
      system: "http://terminology.hl7.org/CodeSystem/condition-category",
      code: "problem-list-item",
      display: "Problem List Item",
    });
  });

  test("builds riwayat penyakit pribadi with previous-condition and clinical status", () => {
    const condition = createAnamnesisBuilder(context).buildPersonalHistory({
      code: { code: "161501007", display: "History of hypertension" },
      clinicalStatus: "active",
    });

    expect(condition.category?.[0]?.coding[0]?.code).toBe("previous-condition");
    expect(condition.category?.[0]?.coding[0]?.system).toBe("http://terminology.kemkes.go.id");
    expect(condition.clinicalStatus?.coding[0]).toEqual({
      system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
      code: "active",
      display: "Active",
    });
  });

  test("covers every anamnesis Condition category from the terminology", () => {
    expect(Object.keys(CONDITION_CATEGORIES)).toEqual([
      "problem-list-item",
      "encounter-diagnosis",
      "chief-complaint",
      "previous-condition",
    ]);
  });
});

describe("anamnesis: riwayat penyakit keluarga (FamilyMemberHistory)", () => {
  test("builds a FamilyMemberHistory with FAMMEMB and completed status by default", () => {
    const history = createAnamnesisBuilder(context).buildFamilyHistory({
      conditions: [
        {
          code: { code: "160303001", display: "FH: Diabetes mellitus" },
          outcome: { code: "268910001", display: "Patient's condition improved" },
          contributedToDeath: false,
          onsetAge: { value: 45, unit: "a", system: "http://unitsofmeasure.org", code: "a" },
        },
      ],
      deceasedBoolean: false,
    });

    expect(history).toEqual({
      resourceType: "FamilyMemberHistory",
      status: "completed",
      patient: context.subject,
      relationship: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/v3-RoleCode",
            code: "FAMMEMB",
            display: "Family member",
          },
        ],
      },
      deceasedBoolean: false,
      condition: [
        {
          code: {
            coding: [
              {
                system: "http://snomed.info/sct",
                code: "160303001",
                display: "FH: Diabetes mellitus",
              },
            ],
          },
          outcome: {
            coding: [
              {
                system: "http://snomed.info/sct",
                code: "268910001",
                display: "Patient's condition improved",
              },
            ],
          },
          contributedToDeath: false,
          onsetAge: { value: 45, unit: "a", system: "http://unitsofmeasure.org", code: "a" },
        },
      ],
    });
  });

  test("requires at least one condition on submission", () => {
    expect(() =>
      FamilyMemberHistoryCreateSchema.parse({
        resourceType: "FamilyMemberHistory",
        status: "completed",
        patient: context.subject,
        relationship: { coding: [{ system: "x", code: "FAMMEMB" }] },
      }),
    ).toThrow("FamilyMemberHistory requires at least one condition");
  });

  test("posts and searches FamilyMemberHistory through the client", async () => {
    const requests: Array<{ method: string; url: string }> = [];
    const history = createAnamnesisBuilder(context).buildFamilyHistory({
      conditions: [{ code: { code: "160303001", display: "FH: Diabetes mellitus" } }],
    });
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (input, init) => {
        requests.push({ method: init?.method ?? "GET", url: String(input) });
        const body =
          init?.method === "POST"
            ? { ...JSON.parse(String(init.body)), id: "fmh-1" }
            : {
                resourceType: "Bundle",
                total: 1,
                entry: [{ resource: { ...history, id: "fmh-1" } }],
              };

        return new Response(JSON.stringify(body), {
          status: init?.method === "POST" ? 201 : 200,
          headers: { "content-type": "application/json" },
        });
      },
    });

    const created = await client.familyMemberHistory.create(history);
    const found = await client.familyMemberHistory.search({ patient: "P02478375538" });

    expect(created.id).toBe("fmh-1");
    expect(requests[0]?.url).toContain("/FamilyMemberHistory");
    expect(requests[1]?.url).toContain("/FamilyMemberHistory?patient=P02478375538");
    expect(found.entry?.[0]?.resource.condition?.[0]?.code.coding[0]?.code).toBe("160303001");
  });
});

describe("anamnesis: riwayat alergi (AllergyIntolerance)", () => {
  test("builds an allergy with patient, encounter, recorder, and reaction manifestations", () => {
    const allergy = createAnamnesisBuilder(context).buildAllergy({
      category: ["food"],
      code: { code: "227493005", display: "Cashew nuts" },
      verificationStatus: "confirmed",
      criticality: "low",
      reaction: [{ manifestation: ["126485001"], severity: "mild" }],
    });

    expect(allergy.clinicalStatus?.coding[0]).toEqual({
      system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
      code: "active",
      display: "Active",
    });
    expect(allergy.verificationStatus?.coding[0]?.code).toBe("confirmed");
    expect(allergy.category).toEqual(["food"]);
    expect(allergy.patient).toEqual(context.subject);
    expect(allergy.encounter).toEqual(context.encounter);
    expect(allergy.recorder).toEqual(context.recorder);
    expect(allergy.reaction?.[0]?.manifestation[0]?.coding?.[0]).toEqual({
      system: "http://snomed.info/sct",
      code: "126485001",
      display: "Urticaria",
    });
  });

  test("accepts a text manifestation (the only form the sandbox accepts today)", () => {
    const allergy = createAnamnesisBuilder(context).buildAllergy({
      category: ["food"],
      code: { code: "227493005", display: "Cashew nuts" },
      reaction: [{ manifestation: [{ text: "Gatal-gatal (urtikaria)" }] }],
    });

    expect(allergy.reaction?.[0]?.manifestation[0]).toEqual({ text: "Gatal-gatal (urtikaria)" });
    expect(() => AllergyIntoleranceSchema.parse({ ...allergy, id: "allergy-1" })).not.toThrow();
  });

  test("needs a recorder in the context", () => {
    const { recorder: _recorder, ...withoutRecorder } = context;

    expect(() =>
      createAnamnesisBuilder(withoutRecorder).buildAllergy({
        category: ["food"],
        code: { code: "227493005", display: "Cashew nuts" },
      }),
    ).toThrow("needs a recorder");
  });

  test("rejects allergies without category, encounter, or recorder on submission only", () => {
    const stored = {
      resourceType: "AllergyIntolerance" as const,
      code: { coding: [{ system: "http://snomed.info/sct", code: "227493005" }] },
      patient: context.subject,
    };

    expect(() => AllergyIntoleranceCreateSchema.parse(stored)).toThrow(
      "AllergyIntolerance.recorder is required by SATUSEHAT",
    );
    expect(() => AllergyIntoleranceSchema.parse({ ...stored, id: "allergy-1" })).not.toThrow();
  });

  test("every official reaction manifestation is a SNOMED CT coding", () => {
    const builder = createAnamnesisBuilder(context);

    for (const code of Object.keys(ALLERGY_INTOLERANCE_REACTION_MANIFESTATIONS)) {
      const allergy = builder.buildAllergy({
        category: ["medication"],
        code: { system: "http://sys-ids.kemkes.go.id/kfa", code: "91000101", display: "x" },
        reaction: [{ manifestation: [code as "126485001"] }],
      });

      expect(allergy.reaction?.[0]?.manifestation[0]?.coding?.[0]?.system).toBe(
        "http://snomed.info/sct",
      );
    }
  });
});

describe("anamnesis: riwayat pengobatan (MedicationStatement)", () => {
  test("uses a KFA code for a drug from outside the facility and links the encounter", () => {
    const statement = createAnamnesisBuilder(context).buildMedicationHistory({
      medication: { kfa: { code: "92001087", display: "Ampicillin Trihydrate 500 mg Tablet" } },
      status: "completed",
      category: "community",
      note: "Diminum 3x sehari selama 5 hari",
    });

    expect(statement.medicationCodeableConcept?.coding?.[0]).toEqual({
      system: "http://sys-ids.kemkes.go.id/kfa",
      code: "92001087",
      display: "Ampicillin Trihydrate 500 mg Tablet",
    });
    expect(statement.context).toEqual(context.encounter);
    expect(statement.subject).toEqual(context.subject);
    expect(statement.category?.coding?.[0]?.code).toBe("community");
    expect(statement.note?.[0]?.text).toBe("Diminum 3x sehari selama 5 hari");
  });

  test("keeps contained Medication resources for drugs from the same facility", () => {
    const statement = createAnamnesisBuilder(context).buildMedicationHistory({
      medication: {
        reference: "#med-1",
        contained: [
          {
            resourceType: "Medication",
            id: "med-1",
            code: { coding: [{ system: "http://sys-ids.kemkes.go.id/kfa", code: "93005512" }] },
          },
        ],
      },
      status: "active",
    });

    expect(statement.medicationReference?.reference).toBe("#med-1");
    expect(statement.contained?.[0]?.id).toBe("med-1");
    expect(MedicationStatementCreateSchema.parse(statement).contained).toHaveLength(1);
  });

  test("rejects invalid submissions before sending", async () => {
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async () => {
        throw new Error("Request must not be sent for an invalid payload");
      },
    });

    await expect(
      client.allergyIntolerance.create({
        resourceType: "AllergyIntolerance",
        code: { coding: [{ system: "http://snomed.info/sct", code: "227493005" }] },
        patient: context.subject,
      }),
    ).rejects.toBeInstanceOf(SatuSehatValidationError);
  });
});

describe("update (PUT) sends the resource id in the body", () => {
  test("adds the id for resources whose update schema has no id field", async () => {
    const bodies: Array<Record<string, unknown>> = [];
    const client = createSatuSehatClient({
      accessToken: "test-token",
      fetch: async (_input, init) => {
        const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
        bodies.push(body);

        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    });
    const anamnesis = createAnamnesisBuilder(context);

    await client.condition.update({
      id: "cond-1",
      body: anamnesis.buildChiefComplaint({ code: { code: "386661006", display: "Fever" } }),
    });
    await client.allergyIntolerance.update({
      id: "allergy-1",
      body: anamnesis.buildAllergy({
        category: ["food"],
        code: { code: "227493005", display: "Cashew nuts" },
      }),
    });
    await client.familyMemberHistory.update({
      id: "fmh-1",
      body: anamnesis.buildFamilyHistory({
        conditions: [{ code: { code: "160303001", display: "FH: Diabetes mellitus" } }],
      }),
    });

    expect(bodies.map((body) => body.id)).toEqual(["cond-1", "allergy-1", "fmh-1"]);
  });
});

import { describe, test } from "node:test";

import {
  createEncounterBuilder,
  createEncounterConditionBuilder,
} from "../src";
import type { ConditionCreateInput, EncounterCreateInput } from "../src";
import { expect } from "./helpers/expect";

const ENCOUNTER_UUID = "urn:uuid:46cd6c7b-706a-45cc-be83-6447c4863a32";
const CONDITION_UUID = "urn:uuid:d36831ce-18fc-4218-95b0-f7872c99df07";

type EncounterTransactionEntry = {
  fullUrl: string;
  resource: EncounterCreateInput;
  request: { method: "POST"; url: "Encounter" };
};

type ConditionTransactionEntry = {
  fullUrl: string;
  resource: ConditionCreateInput;
  request: { method: "POST"; url: "Condition" };
};

type TransactionBundle = {
  resourceType: "Bundle";
  type: "transaction";
  entry: [EncounterTransactionEntry, ConditionTransactionEntry];
};

type TransactionResponseBundle = {
  resourceType: "Bundle";
  type: "transaction-response";
  entry: [
    {
      response: {
        status: string;
        location: string;
      };
      resource: EncounterCreateInput & { id: string };
    },
    {
      response: {
        status: string;
        location: string;
      };
      resource: ConditionCreateInput & { id: string };
    },
  ];
};

function getPrimaryEncounterDiagnosis(encounter: EncounterCreateInput) {
  const diagnosis = encounter.diagnosis?.[0];

  expect(diagnosis).toBeDefined();
  if (!diagnosis) {
    throw new Error("Expected encounter to contain a diagnosis entry");
  }

  return diagnosis;
}

const encounterResource: EncounterCreateInput = {
  resourceType: "Encounter",
  identifier: [
    {
      system: "http://sys-ids.kemkes.go.id/encounter/100025939",
      use: "official",
      value: "ANTRI-88537",
    },
  ],
  status: "finished",
  statusHistory: [
    {
      status: "finished",
      period: {
        start: "2026-04-06T14:01:52.000+00:00",
        end: "2026-04-06T14:31:52.000+00:00",
      },
    },
  ],
  class: {
    system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
    code: "AMB",
    display: "ambulatory",
  },
  classHistory: [
    {
      class: {
        system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
        code: "AMB",
        display: "ambulatory",
      },
      period: {
        start: "2026-04-06T14:01:52.000+00:00",
        end: "2026-04-06T14:31:52.000+00:00",
      },
    },
  ],
  subject: {
    reference: "Patient/P02361976250",
    display: "LINA,NY",
  },
  participant: [
    {
      individual: {
        reference: "Practitioner/10006330933",
        display: "dr. Asih Aprilya, Sp. KFR, M.Ked.Klin",
      },
    },
  ],
  period: {
    start: "2026-04-06T14:01:52.000+00:00",
    end: "2026-04-06T14:31:52.000+00:00",
  },
  reasonCode: [
    {
      coding: [
        {
          system: "http://snomed.info/sct",
          code: "185349003",
          display: "Encounter for check up",
        },
      ],
      text: "PRIMARY GONARTHROSIS. BILATERAL",
    },
  ],
  diagnosis: [
    {
      condition: {
        reference: CONDITION_UUID,
        display: "PRIMARY GONARTHROSIS. BILATERAL",
      },
      use: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/diagnosis-role",
            code: "AD",
            display: "Admission diagnosis",
          },
        ],
      },
      rank: 1,
    },
  ],
  location: [
    {
      location: {
        reference: "Location/2148a1a7-925d-4543-ac63-2e9bf53e5c68",
        display: "FISIO TERAPI",
      },
    },
  ],
  serviceProvider: {
    reference: "Organization/100025939",
  },
};

const conditionResource: ConditionCreateInput = {
  resourceType: "Condition",
  identifier: [
    {
      system: "http://sys-ids.kemkes.go.id/condition/100025939",
      use: "official",
      value: "ANTRI-88537-DX",
    },
  ],
  code: {
    coding: [
      {
        system: "http://hl7.org/fhir/sid/icd-10",
        code: "M17.0",
        display: "PRIMARY GONARTHROSIS. BILATERAL",
      },
    ],
    text: "PRIMARY GONARTHROSIS. BILATERAL",
  },
  subject: {
    reference: "Patient/P02361976250",
    display: "LINA,NY",
  },
  encounter: {
    reference: ENCOUNTER_UUID,
  },
};

function buildBundle(): TransactionBundle {
  return {
    resourceType: "Bundle",
    type: "transaction",
    entry: [
      {
        fullUrl: ENCOUNTER_UUID,
        resource: encounterResource,
        request: { method: "POST", url: "Encounter" },
      },
      {
        fullUrl: CONDITION_UUID,
        resource: conditionResource,
        request: { method: "POST", url: "Condition" },
      },
    ],
  };
}

describe("encounter bundle transaction integration", () => {
  test("builds encounter and condition resources using builders that match the transaction bundle", () => {
    const subject = { reference: "Patient/P02361976250", display: "LINA,NY" };

    const encounterBuilder = createEncounterBuilder({
      preset: "outpatient",
      identifier: {
        system: "http://sys-ids.kemkes.go.id/encounter/100025939",
        use: "official",
        value: "ANTRI-88537",
      },
      status: "finished",
      statusHistory: [
        {
          status: "finished",
          period: {
            start: "2026-04-06T14:01:52.000+00:00",
            end: "2026-04-06T14:31:52.000+00:00",
          },
        },
      ],
      classHistory: [
        {
          class: {
            system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
            code: "AMB",
            display: "ambulatory",
          },
          period: {
            start: "2026-04-06T14:01:52.000+00:00",
            end: "2026-04-06T14:31:52.000+00:00",
          },
        },
      ],
      subject,
      participant: [
        {
          individual: {
            reference: "Practitioner/10006330933",
            display: "dr. Asih Aprilya, Sp. KFR, M.Ked.Klin",
          },
        },
      ],
      period: {
        start: "2026-04-06T14:01:52.000+00:00",
        end: "2026-04-06T14:31:52.000+00:00",
      },
      reasonCode: [
        {
          coding: [
            {
              system: "http://hl7.org/fhir/sid/icd-10",
              code: "M17.0",
              display: "PRIMARY GONARTHROSIS. BILATERAL",
            },
          ],
          text: "PRIMARY GONARTHROSIS. BILATERAL",
        },
      ],
      diagnosis: [
        {
          condition: {
            reference: CONDITION_UUID,
            display: "PRIMARY GONARTHROSIS. BILATERAL",
          },
          use: {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/diagnosis-role",
                code: "AD",
                display: "Admission diagnosis",
              },
            ],
          },
          rank: 1,
        },
      ],
      location: [
        {
          location: {
            reference: "Location/2148a1a7-925d-4543-ac63-2e9bf53e5c68",
            display: "FISIO TERAPI",
          },
        },
      ],
      serviceProvider: {
        reference: "Organization/100025939",
      },
    });

    const conditionBuilder = createEncounterConditionBuilder({
      subject,
      encounter: { reference: ENCOUNTER_UUID },
      condition: {
        identifier: [
          {
            system: "http://sys-ids.kemkes.go.id/condition/100025939",
            use: "official",
            value: "ANTRI-88537-DX",
          },
        ],
        code: {
          coding: [
            {
              system: "http://hl7.org/fhir/sid/icd-10",
              code: "M17.0",
              display: "PRIMARY GONARTHROSIS. BILATERAL",
            },
          ],
          text: "PRIMARY GONARTHROSIS. BILATERAL",
        },
      },
    });

    const builtEncounter = encounterBuilder.build();
    const builtCondition = conditionBuilder.buildCondition();
    const primaryDiagnosis = getPrimaryEncounterDiagnosis(builtEncounter);

    const primaryDiagnosisCoding = primaryDiagnosis.use.coding?.[0];

    expect(primaryDiagnosisCoding).toBeDefined();
    if (!primaryDiagnosisCoding) {
      throw new Error("Expected built encounter diagnosis to contain coding");
    }

    // Verify encounter structure
    expect(builtEncounter.resourceType).toBe("Encounter");
    expect(builtEncounter.status).toBe("finished");
    expect(builtEncounter.class.code).toBe("AMB");
    expect(builtEncounter.subject.reference).toBe("Patient/P02361976250");
    expect(primaryDiagnosis.condition.reference).toBe(CONDITION_UUID);
    expect(primaryDiagnosisCoding.code).toBe("AD");
    expect(primaryDiagnosis.rank).toBe(1);

    // Verify condition structure
    expect(builtCondition.resourceType).toBe("Condition");
    expect(builtCondition.subject.reference).toBe("Patient/P02361976250");
    expect(builtCondition.encounter.reference).toBe(ENCOUNTER_UUID);
    expect(builtCondition.code.coding?.[0]?.code).toBe("M17.0");
  });

  test("assembles a valid FHIR transaction bundle with cross-referenced urn:uuid entries", () => {
    const bundle = buildBundle();

    expect(bundle.resourceType).toBe("Bundle");
    expect(bundle.type).toBe("transaction");
    expect(bundle.entry).toHaveLength(2);

    // Encounter entry
    const encounterEntry = bundle.entry[0];
    const encounterDiagnosis = getPrimaryEncounterDiagnosis(encounterEntry.resource);
    expect(encounterEntry.fullUrl).toBe(ENCOUNTER_UUID);
    expect(encounterEntry.request).toEqual({ method: "POST", url: "Encounter" });
    expect(encounterEntry.resource.resourceType).toBe("Encounter");
    expect(encounterDiagnosis.condition.reference).toBe(CONDITION_UUID);

    // Condition entry
    const conditionEntry = bundle.entry[1];
    expect(conditionEntry.fullUrl).toBe(CONDITION_UUID);
    expect(conditionEntry.request).toEqual({ method: "POST", url: "Condition" });
    expect(conditionEntry.resource.resourceType).toBe("Condition");
    expect(conditionEntry.resource.encounter.reference).toBe(ENCOUNTER_UUID);
  });

  test("sends the transaction bundle via mocked fetch and verifies the request payload", async () => {
    let capturedMethod: string | undefined;
    let capturedBody: unknown;

    const mockFetch = async (input: unknown, init?: RequestInit) => {
      capturedMethod = init?.method;
      capturedBody = init?.body ? JSON.parse(String(init.body)) : undefined;

      const url = String(input);

      const responsePayload = {
        resourceType: "Bundle",
        type: "transaction-response",
        entry: [
          {
            response: {
              status: "201 Created",
              location: "Encounter/enc-new-id/_history/1",
            },
            resource: {
              id: "enc-new-id",
              ...encounterResource,
            },
          },
          {
            response: {
              status: "201 Created",
              location: "Condition/cond-new-id/_history/1",
            },
            resource: {
              id: "cond-new-id",
              ...conditionResource,
            },
          },
        ],
      } satisfies TransactionResponseBundle;

      console.log(`[SatuSehat] POST ${url}`);
      console.log("[SatuSehat] Request body:", JSON.stringify(capturedBody, null, 2));
      console.log("[SatuSehat] Response status: 200");
      console.log("[SatuSehat] Response body:", JSON.stringify(responsePayload, null, 2));

      return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };

    const bundle = buildBundle();

    const response = await mockFetch(
      "https://api-satusehat-stg.dto.kemkes.go.id/fhir-r4/v1",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer test-token",
        },
        body: JSON.stringify(bundle),
      },
    );

    expect(capturedMethod).toBe("POST");
    expect(capturedBody).toEqual(bundle);
    const sentBundle = capturedBody as TransactionBundle;

    expect(sentBundle.resourceType).toBe("Bundle");
    expect(sentBundle.type).toBe("transaction");
    expect(sentBundle.entry).toHaveLength(2);

    // Verify cross-references are intact in the sent payload
    const entries = sentBundle.entry;

    expect(entries[0].fullUrl).toBe(ENCOUNTER_UUID);
    expect(entries[0].request).toEqual({ method: "POST", url: "Encounter" });
    expect(entries[1].fullUrl).toBe(CONDITION_UUID);
    expect(entries[1].request).toEqual({ method: "POST", url: "Condition" });

    // Verify the response is a valid transaction-response bundle
    const responseBody = (await response.json()) as TransactionResponseBundle;
    expect(responseBody.resourceType).toBe("Bundle");
    expect(responseBody.type).toBe("transaction-response");
    expect(responseBody.entry[0].response.status).toBe("201 Created");
    expect(responseBody.entry[0].resource.id).toBe("enc-new-id");
    expect(responseBody.entry[1].resource.id).toBe("cond-new-id");
  });

  test("logs error response from Satu Sehat when bundle transaction fails", async () => {
    const errorPayload = {
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "error",
          code: "processing",
          diagnostics: "Encounter.diagnosis[0].condition.reference: Invalid reference format",
        },
      ],
    };

    const mockFetch = async (input: unknown, init?: RequestInit) => {
      const url = String(input);
      const requestBody = init?.body ? JSON.parse(String(init.body)) : undefined;

      console.log(`[SatuSehat] POST ${url}`);
      console.log("[SatuSehat] Request body:", JSON.stringify(requestBody, null, 2));
      console.error("[SatuSehat] Response status: 400");
      console.error("[SatuSehat] Error response:", JSON.stringify(errorPayload, null, 2));

      return new Response(JSON.stringify(errorPayload), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    };

    const bundle = buildBundle();

    const response = await mockFetch(
      "https://api-satusehat-stg.dto.kemkes.go.id/fhir-r4/v1",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer test-token",
        },
        body: JSON.stringify(bundle),
      },
    );

    expect(response.status).toBe(400);

    const responseBody = (await response.json()) as {
      resourceType: string;
      issue: Array<{ severity: string; diagnostics: string }>;
    };
    expect(responseBody.resourceType).toBe("OperationOutcome");
    expect(responseBody.issue[0]?.severity).toBe("error");
    expect(responseBody.issue[0]?.diagnostics).toContain("Invalid reference format");
  });

  test("condition references the encounter and encounter diagnosis references the condition via urn:uuid", () => {
    const bundle = buildBundle();

    const encounterEntry = bundle.entry[0];
    const conditionEntry = bundle.entry[1];
    const encounterDiagnosis = getPrimaryEncounterDiagnosis(encounterEntry.resource);

    // Encounter -> Condition (via diagnosis.condition.reference)
    const diagnosisRef = encounterDiagnosis.condition.reference;
    expect(diagnosisRef).toBe(conditionEntry.fullUrl);

    // Condition -> Encounter (via encounter.reference)
    const encounterRef = conditionEntry.resource.encounter.reference;
    expect(encounterRef).toBe(encounterEntry.fullUrl);

    // Both share the same subject
    expect(encounterEntry.resource.subject.reference).toBe(
      conditionEntry.resource.subject.reference,
    );
  });
});

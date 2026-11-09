import { describe, test } from "node:test";

import {
  createEmergencyEncounterHistory,
  createEncounterBuilder,
  createEncounterConditionBuilder,
  createEncounterMedicationAdministrationBuilder,
  createEncounterMedicationBuilder,
  createEncounterMedicationRequestBuilder,
  createEncounterProcedureBuilder,
} from "../src";
import type { EncounterCreateInput } from "../src";
import { createEncounterFixture } from "./fixtures/encounter";
import { expect } from "./helpers/expect";

function toBuilderInput(fixture: EncounterCreateInput) {
  return {
    identifier: fixture.identifier,
    status: fixture.status,
    statusHistory: fixture.statusHistory,
    classHistory: fixture.classHistory,
    ...(fixture.type ? { type: fixture.type } : {}),
    ...(fixture.serviceType ? { serviceType: fixture.serviceType } : {}),
    ...(fixture.priority ? { priority: fixture.priority } : {}),
    subject: fixture.subject,
    ...(fixture.episodeOfCare ? { episodeOfCare: fixture.episodeOfCare } : {}),
    ...(fixture.basedOn ? { basedOn: fixture.basedOn } : {}),
    ...(fixture.participant ? { participant: fixture.participant } : {}),
    period: fixture.period,
    ...(fixture.length ? { length: fixture.length } : {}),
    reasonCode: fixture.reasonCode,
    ...(fixture.reasonReference ? { reasonReference: fixture.reasonReference } : {}),
    diagnosis: fixture.diagnosis,
    ...(fixture.account ? { account: fixture.account } : {}),
    ...(fixture.hospitalization ? { hospitalization: fixture.hospitalization } : {}),
    location: fixture.location,
    serviceProvider: fixture.serviceProvider,
    ...(fixture.partOf ? { partOf: fixture.partOf } : {}),
  };
}

describe("encounter -> medication builder", () => {
  test("builds a medication draft and derives a reusable medication reference", () => {
    const builder = createEncounterMedicationBuilder({
      medication: {
        code: {
          coding: [
            {
              system: "http://sys-ids.kemkes.go.id/kfa",
              code: "93001002",
              display: "Paracetamol 500 mg tablet",
            },
          ],
        },
        extension: [
          {
            url: "https://fhir.kemkes.go.id/r4/StructureDefinition/MedicationType",
            valueCodeableConcept: {
              coding: [
                {
                  system: "http://terminology.kemkes.go.id/CodeSystem/medication-type",
                  code: "NC",
                  display: "Non-compound",
                },
              ],
            },
          },
        ],
      },
    })
      .addIdentifier({
        system: "http://sys-ids.kemkes.go.id/medication/10000004",
        use: "official",
        value: "MED-0001",
      })
      .setStatus("active")
      .setForm({
        coding: [
          {
            system: "http://terminology.kemkes.go.id/CodeSystem/medication-form",
            code: "BS066",
            display: "Tablet",
          },
        ],
      })
      .addIngredient({
        itemCodeableConcept: {
          coding: [
            {
              system: "http://sys-ids.kemkes.go.id/kfa",
              code: "91000197",
              display: "Paracetamol",
            },
          ],
        },
        isActive: true,
      })
      .setBatch({
        lotNumber: "LOT-001",
        expirationDate: "2027-12-31",
      });

    const medication = builder.buildMedication();
    const medicationReference = builder.buildMedicationReference({
      medicationId: "med-123",
    });

    expect(medication.resourceType).toBe("Medication");
    expect(medication.code?.coding[0]?.display).toBe("Paracetamol 500 mg tablet");
    expect(medication.identifier?.[0]?.value).toBe("MED-0001");
    expect(medication.batch?.lotNumber).toBe("LOT-001");
    expect(medicationReference.reference).toBe("Medication/med-123");
    expect(medicationReference.display).toBe("Paracetamol 500 mg tablet");
  });

  test("normalizes medication updates and allows an explicit downstream reference", () => {
    const builder = createEncounterMedicationBuilder({
      medication: {
        extension: [
          {
            url: "https://fhir.kemkes.go.id/r4/StructureDefinition/MedicationType",
            valueCodeableConcept: {
              coding: [
                {
                  system: "http://terminology.kemkes.go.id/CodeSystem/medication-type",
                  code: "NC",
                  display: "Non-compound",
                },
              ],
            },
          },
        ],
      },
    })
      .setCode({
        coding: [
          {
            system: "http://sys-ids.kemkes.go.id/kfa",
            code: "93001002",
            display: "Paracetamol 500 mg tablet",
          },
        ],
      })
      .setMedicationType({
        coding: [
          {
            system: "http://terminology.kemkes.go.id/CodeSystem/medication-type",
            code: "OC",
            display: "Compound",
          },
        ],
      })
      .mergeMedication({
        manufacturer: {
          reference: "Organization/10000004",
          display: "RS SATUSEHAT",
        },
      })
      .setAmount({
        numerator: {
          value: 10,
          unit: "TAB",
          system: "http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm",
          code: "TAB",
        },
        denominator: {
          value: 1,
          unit: "package",
          system: "http://unitsofmeasure.org",
          code: "{Package}",
        },
      });

    const medication = builder.buildMedication();
    const medicationReference = builder.buildMedicationReference({
      medicationReference: {
        reference: "Medication/custom-med",
        display: "Puyer demam anak",
      },
    });

    expect(medication.manufacturer?.reference).toBe("Organization/10000004");
    expect(medication.amount?.numerator?.value).toBe(10);
    expect(medication.extension[0]?.valueCodeableConcept.coding[0]?.code).toBe("OC");
    expect(medicationReference.reference).toBe("Medication/custom-med");
    expect(medicationReference.display).toBe("Puyer demam anak");
  });

  test("supports an end-to-end IGD medication workflow after encounter creation", () => {
    const fixture = createEncounterFixture("emergency");
    const emergencyFlow = createEmergencyEncounterHistory({
      statusStages: [
        {
          status: "arrived",
          start: "2024-04-03T01:00:00+00:00",
        },
        {
          status: "triaged",
          start: "2024-04-03T01:05:00+00:00",
        },
        {
          status: "in-progress",
          start: "2024-04-03T01:15:00+00:00",
        },
      ],
      periodEnd: "2024-04-03T03:00:00+00:00",
    });

    const encounterDraft = createEncounterBuilder({
      ...emergencyFlow,
      ...toBuilderInput(fixture),
    }).build();

    const conditionBuilder = createEncounterConditionBuilder({
      subject: encounterDraft.subject,
      encounter: {
        reference: "Encounter/enc-igd-1",
      },
      condition: {
        code: {
          coding: [
            {
              system: "http://hl7.org/fhir/sid/icd-10",
              code: "J06.9",
              display: "Acute upper respiratory infection, unspecified",
            },
          ],
        },
      },
    });
    const conditionReference = conditionBuilder.buildEncounterDiagnosis({
      conditionId: "cond-igd-1",
    }).condition;

    const procedure = createEncounterProcedureBuilder({
      subject: encounterDraft.subject,
      encounter: {
        reference: "Encounter/enc-igd-1",
      },
      procedure: {
        status: "completed",
        code: {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "386053000",
              display: "Evaluation procedure",
            },
          ],
        },
      },
    }).buildProcedure();

    const medicationBuilder = createEncounterMedicationBuilder({
      medication: {
        code: {
          coding: [
            {
              system: "http://sys-ids.kemkes.go.id/kfa",
              code: "93001002",
              display: "Paracetamol 500 mg tablet",
            },
          ],
        },
        extension: [
          {
            url: "https://fhir.kemkes.go.id/r4/StructureDefinition/MedicationType",
            valueCodeableConcept: {
              coding: [
                {
                  system: "http://terminology.kemkes.go.id/CodeSystem/medication-type",
                  code: "NC",
                  display: "Non-compound",
                },
              ],
            },
          },
        ],
      },
    })
      .addIdentifier({
        system: "http://sys-ids.kemkes.go.id/medication/10000004",
        use: "official",
        value: "MED-IGD-001",
      })
      .setStatus("active");

    const medicationReference = medicationBuilder.buildMedicationReference({
      medicationId: "med-igd-1",
    });

    const medicationRequest = createEncounterMedicationRequestBuilder({
      subject: encounterDraft.subject,
      encounter: {
        reference: "Encounter/enc-igd-1",
      },
      medicationRequest: {
        status: "active",
        intent: "order",
        medicationReference,
        reasonCode: encounterDraft.reasonCode,
      },
    })
      .addReasonReference(conditionReference)
      .addBasedOn({
        reference: "Procedure/proc-igd-1",
        display: procedure.code.coding[0]?.display,
      })
      .buildMedicationRequest();

    const medicationAdministration = createEncounterMedicationAdministrationBuilder({
      subject: encounterDraft.subject,
      encounter: {
        reference: "Encounter/enc-igd-1",
      },
      medicationAdministration: {
        status: "completed",
        medicationReference,
        effectiveDateTime: encounterDraft.period.end ?? "2024-04-03T03:00:00+00:00",
      },
    })
      .setRequest({
        reference: "MedicationRequest/mr-igd-1",
      })
      .addSupportingInformation(conditionReference)
      .buildMedicationAdministration();

    expect(medicationBuilder.buildMedication().identifier?.[0]?.value).toBe("MED-IGD-001");
    expect(medicationRequest.medicationReference.display).toBe("Paracetamol 500 mg tablet");
    expect(medicationRequest.reasonReference?.[0]?.reference).toBe("Condition/cond-igd-1");
    expect(medicationRequest.basedOn?.[0]?.reference).toBe("Procedure/proc-igd-1");
    expect(medicationAdministration.medicationReference?.reference).toBe("Medication/med-igd-1");
    expect(medicationAdministration.supportingInformation?.[0]?.reference).toBe(
      "Condition/cond-igd-1",
    );
  });

  test("requires a created medication reference before linking downstream resources", () => {
    const builder = createEncounterMedicationBuilder({
      medication: {
        extension: [
          {
            url: "https://fhir.kemkes.go.id/r4/StructureDefinition/MedicationType",
            valueCodeableConcept: {
              coding: [
                {
                  system: "http://terminology.kemkes.go.id/CodeSystem/medication-type",
                  code: "NC",
                  display: "Non-compound",
                },
              ],
            },
          },
        ],
      },
    });

    expect(() => builder.buildMedicationReference()).toThrow(
      "Medication link is required. Provide medicationId or medicationReference before building Medication reference.",
    );
  });
});

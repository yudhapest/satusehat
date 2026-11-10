import { describe, test } from "node:test";

import { createLaboratoryPanelBuilder } from "../src";
import { expect } from "./helpers/expect";

describe("laboratory panel builder", () => {
  test("builds a lab panel flow with multiple observations", () => {
    const builder = createLaboratoryPanelBuilder({
      subject: {
        reference: "Patient/100000030009",
        display: "Budi Santoso",
      },
      encounter: {
        reference: "Encounter/4f735a03-128b-464d-bf91-e6eacdf1c38f",
      },
      serviceRequest: {
        status: "active",
        intent: "order",
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "58410-2",
              display: "Complete blood count panel",
            },
          ],
        },
      },
      specimen: {
        status: "available",
        type: {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "119364003",
              display: "Serum specimen",
            },
          ],
        },
      },
      diagnosticReport: {
        status: "final",
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "58410-2",
              display: "Complete blood count panel",
            },
          ],
        },
      },
      observationDefaults: {
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "laboratory",
                display: "Laboratory",
              },
            ],
          },
        ],
      },
    })
      .mergeServiceRequest({
        authoredOn: "2024-04-01T02:45:00+00:00",
      })
      .setSpecimenCollection({
        collector: {
          reference: "Practitioner/N10000001",
        },
        collectedDateTime: "2024-04-01T03:00:00+00:00",
      })
      .addObservation("hemoglobin", {
        status: "final",
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "718-7",
              display: "Hemoglobin",
            },
          ],
        },
      })
      .setObservationValueQuantity("hemoglobin", {
        value: 13.5,
        unit: "g/dL",
        system: "http://unitsofmeasure.org",
        code: "g/dL",
      })
      .addObservation("hematocrit", {
        status: "final",
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "4544-3",
              display: "Hematocrit",
            },
          ],
        },
      })
      .setObservationValueQuantity("hematocrit", {
        value: 41,
        unit: "%",
        system: "http://unitsofmeasure.org",
        code: "%",
      })
      .mergeDiagnosticReport({
        conclusion: "Panel darah lengkap dalam batas normal.",
      });

    const serviceRequest = builder.buildServiceRequest();
    const specimen = builder.buildSpecimen({
      serviceRequestId: "srv-1",
    });
    const observationEntries = builder.buildObservationEntries({
      serviceRequestId: "srv-1",
      specimenId: "spm-1",
    });
    const diagnosticReport = builder.buildDiagnosticReport({
      serviceRequestId: "srv-1",
      specimenId: "spm-1",
      resultIds: ["obs-1", "obs-2"],
    });

    expect(serviceRequest.subject.reference).toBe("Patient/100000030009");
    expect(specimen.request?.[0]?.reference).toBe("ServiceRequest/srv-1");

    expect(builder.listObservationKeys()).toEqual(["hemoglobin", "hematocrit"]);
    expect(observationEntries).toHaveLength(2);
    expect(observationEntries[0]?.key).toBe("hemoglobin");
    expect(observationEntries[0]?.body.basedOn?.[0]?.reference).toBe("ServiceRequest/srv-1");
    expect(observationEntries[0]?.body.specimen?.reference).toBe("Specimen/spm-1");
    expect(observationEntries[0]?.body.valueQuantity?.value).toBe(13.5);
    expect(observationEntries[1]?.key).toBe("hematocrit");
    expect(observationEntries[1]?.body.valueQuantity?.value).toBe(41);

    expect(diagnosticReport.basedOn?.[0]?.reference).toBe("ServiceRequest/srv-1");
    expect(diagnosticReport.specimen?.[0]?.reference).toBe("Specimen/spm-1");
    expect(diagnosticReport.result).toHaveLength(2);
    expect(diagnosticReport.result?.[0]?.reference).toBe("Observation/obs-1");
    expect(diagnosticReport.result?.[1]?.reference).toBe("Observation/obs-2");
    expect(diagnosticReport.conclusion).toBe("Panel darah lengkap dalam batas normal.");
  });

  test("updates shared subject and encounter across all observation drafts", () => {
    const builder = createLaboratoryPanelBuilder({
      subject: {
        reference: "Patient/old",
      },
      encounter: {
        reference: "Encounter/old",
      },
      serviceRequest: {
        status: "active",
        intent: "order",
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "24323-8",
            },
          ],
        },
      },
      specimen: {
        status: "available",
        type: {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "122555007",
            },
          ],
        },
      },
      diagnosticReport: {
        status: "final",
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "24323-8",
            },
          ],
        },
      },
    })
      .addObservation("glucose", {
        status: "final",
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "2345-7",
            },
          ],
        },
      })
      .setSubject({
        reference: "Patient/new",
      })
      .setEncounter({
        reference: "Encounter/new",
      });

    const observation = builder.buildObservation("glucose", {
      serviceRequestId: "srv-2",
      specimenReference: {
        reference: "Specimen/spm-2",
        display: "Tube A",
      },
    });
    const diagnosticReport = builder.buildDiagnosticReport({
      serviceRequestId: "srv-2",
      specimenReference: {
        reference: "Specimen/spm-2",
      },
      resultReferences: [
        {
          reference: "Observation/obs-2",
        },
      ],
    });

    expect(observation.subject.reference).toBe("Patient/new");
    expect(observation.encounter.reference).toBe("Encounter/new");
    expect(observation.specimen?.reference).toBe("Specimen/spm-2");
    expect(diagnosticReport.subject.reference).toBe("Patient/new");
    expect(diagnosticReport.encounter.reference).toBe("Encounter/new");
    expect(diagnosticReport.result?.[0]?.reference).toBe("Observation/obs-2");
  });
});

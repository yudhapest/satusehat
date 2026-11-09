import { describe, test } from "node:test";

import { createServiceRequestSpecimenObservationBuilder } from "../src";
import { expect } from "./helpers/expect";

describe("serviceRequest -> specimen -> observation builder", () => {
  test("builds linked resources with shared subject and encounter", () => {
    const builder = createServiceRequestSpecimenObservationBuilder({
      subject: {
        reference: "Patient/100000030009",
        display: "Budi Santoso",
      },
      encounter: {
        reference: "Encounter/6694e8c8-052a-4ea6-8072-157b6d47ca08",
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
      observation: {
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
    })
      .mergeServiceRequest({
        authoredOn: "2024-04-01T02:45:00+00:00",
      })
      .setSpecimenCollection({
        collector: {
          reference: "Practitioner/N10000001",
          display: "Dokter Bronsig",
        },
        collectedDateTime: "2024-04-01T03:00:00+00:00",
      })
      .addSpecimenContainer({
        description: "Vacutainer merah",
      })
      .setObservationValueQuantity({
        value: 13.5,
        unit: "g/dL",
        system: "http://unitsofmeasure.org",
        code: "g/dL",
      })
      .addObservationNote({
        text: "Hasil dalam batas normal.",
      });

    const serviceRequest = builder.buildServiceRequest();
    const specimen = builder.buildSpecimen({
      serviceRequestId: "srv-1",
    });
    const observation = builder.buildObservation({
      serviceRequestId: "srv-1",
      specimenId: "spm-1",
    });
    const diagnosticReport = builder.buildDiagnosticReport({
      serviceRequestId: "srv-1",
      specimenId: "spm-1",
      resultId: "obs-1",
    });

    expect(serviceRequest.subject.reference).toBe("Patient/100000030009");
    expect(serviceRequest.encounter?.reference).toBe(
      "Encounter/6694e8c8-052a-4ea6-8072-157b6d47ca08",
    );
    expect(serviceRequest.authoredOn).toBe("2024-04-01T02:45:00+00:00");

    expect(specimen.subject.reference).toBe("Patient/100000030009");
    expect(specimen.request?.[0]?.reference).toBe("ServiceRequest/srv-1");
    expect(specimen.collection?.collector?.reference).toBe("Practitioner/N10000001");
    expect(specimen.container?.[0]?.description).toBe("Vacutainer merah");

    expect(observation.subject.reference).toBe("Patient/100000030009");
    expect(observation.encounter.reference).toBe(
      "Encounter/6694e8c8-052a-4ea6-8072-157b6d47ca08",
    );
    expect(observation.basedOn?.[0]?.reference).toBe("ServiceRequest/srv-1");
    expect(observation.specimen?.reference).toBe("Specimen/spm-1");
    expect(observation.valueQuantity?.value).toBe(13.5);
    expect(observation.note?.[0]?.text).toBe("Hasil dalam batas normal.");

    expect(diagnosticReport.subject.reference).toBe("Patient/100000030009");
    expect(diagnosticReport.encounter.reference).toBe(
      "Encounter/6694e8c8-052a-4ea6-8072-157b6d47ca08",
    );
    expect(diagnosticReport.basedOn?.[0]?.reference).toBe("ServiceRequest/srv-1");
    expect(diagnosticReport.specimen?.[0]?.reference).toBe("Specimen/spm-1");
    expect(diagnosticReport.result?.[0]?.reference).toBe("Observation/obs-1");
  });

  test("keeps explicit references and shared updates in sync", () => {
    const builder = createServiceRequestSpecimenObservationBuilder({
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
              code: "33747-0",
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
        request: [
          {
            reference: "ServiceRequest/existing",
          },
        ],
      },
      observation: {
        status: "preliminary",
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "4548-4",
            },
          ],
        },
        basedOn: [
          {
            reference: "ServiceRequest/existing",
          },
        ],
      },
    })
      .setSubject({
        reference: "Patient/new",
      })
      .setDiagnosticReport({
        status: "final",
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "11502-2",
            },
          ],
        },
        basedOn: [
          {
            reference: "ServiceRequest/existing",
          },
        ],
      })
      .setEncounter({
        reference: "Encounter/new",
      });

    const specimen = builder.buildSpecimen({
      serviceRequestId: "existing",
    });
    const observation = builder.buildObservation({
      serviceRequestId: "existing",
      specimenReference: {
        reference: "Specimen/already-known",
        display: "Serum tube",
      },
    });
    const diagnosticReport = builder
      .mergeDiagnosticReport({
        specimen: [
          {
            reference: "Specimen/already-known",
          },
        ],
        result: [
          {
            reference: "Observation/existing-result",
          },
        ],
      })
      .buildDiagnosticReport({
        serviceRequestId: "existing",
        specimenReference: {
          reference: "Specimen/already-known",
          display: "Serum tube",
        },
        resultReference: {
          reference: "Observation/existing-result",
        },
      });

    expect(specimen.subject.reference).toBe("Patient/new");
    expect(specimen.request).toHaveLength(1);
    expect(specimen.request?.[0]?.reference).toBe("ServiceRequest/existing");

    expect(observation.subject.reference).toBe("Patient/new");
    expect(observation.encounter.reference).toBe("Encounter/new");
    expect(observation.basedOn).toHaveLength(1);
    expect(observation.basedOn?.[0]?.reference).toBe("ServiceRequest/existing");
    expect(observation.specimen?.reference).toBe("Specimen/already-known");
    expect(observation.specimen?.display).toBe("Serum tube");

    expect(diagnosticReport.subject.reference).toBe("Patient/new");
    expect(diagnosticReport.encounter.reference).toBe("Encounter/new");
    expect(diagnosticReport.basedOn).toHaveLength(1);
    expect(diagnosticReport.basedOn?.[0]?.reference).toBe("ServiceRequest/existing");
    expect(diagnosticReport.specimen).toHaveLength(1);
    expect(diagnosticReport.specimen?.[0]?.reference).toBe("Specimen/already-known");
    expect(diagnosticReport.result).toHaveLength(1);
    expect(diagnosticReport.result?.[0]?.reference).toBe("Observation/existing-result");
  });
});

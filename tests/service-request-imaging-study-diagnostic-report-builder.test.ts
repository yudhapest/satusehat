import { describe, test } from "node:test";

import { createServiceRequestImagingStudyDiagnosticReportBuilder } from "../src";
import { expect } from "./helpers/expect";

describe("serviceRequest -> imagingStudy -> diagnosticReport builder", () => {
  test("builds linked radiology resources with shared subject and encounter", () => {
    const builder = createServiceRequestImagingStudyDiagnosticReportBuilder({
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
              code: "30745-4",
              display: "CT Chest W contrast IV",
            },
          ],
        },
      },
      imagingStudy: {
        identifier: [
          {
            system: "http://sys-ids.kemkes.go.id/acsn/10000004",
            use: "usual",
            value: "CT.240401.001",
          },
        ],
        status: "available",
        modality: [
          {
            system: "http://dicom.nema.org/resources/ontology/DCM",
            code: "CT",
            display: "Computed Tomography",
          },
        ],
      },
      diagnosticReport: {
        status: "final",
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "18748-4",
              display: "Diagnostic imaging study",
            },
          ],
        },
      },
    })
      .mergeServiceRequest({
        authoredOn: "2024-04-01T02:45:00+00:00",
      })
      .mergeImagingStudy({
        started: "2024-04-01T03:30:00+00:00",
        description: "CT thorax dengan kontras.",
      })
      .addImagingStudyNote({
        text: "Seluruh citra berhasil diunggah ke NIDR.",
      })
      .addImagingStudySeries({
        uid: "1.2.48.670589.30.39.0.1.966169786508.1664950724077.1",
        modality: {
          system: "http://dicom.nema.org/resources/ontology/DCM",
          code: "CT",
          display: "Computed Tomography",
        },
        numberOfInstances: 2,
        instance: [
          {
            uid: "2.16.380.31256.1.2449191199178232.20210610114930875.1.1",
            sopClass: {
              system: "urn:ietf:rfc:3986",
              code: "urn:oid:1.2.840.10008.5.1.4.1.1.2",
            },
          },
        ],
      })
      .mergeDiagnosticReport({
        conclusion: "Tidak tampak efusi pleura. Infiltrat ringan paru kanan atas.",
      })
      .addDiagnosticReportMedia({
        comment: "Preview axial slice",
        link: {
          reference: "Media/media-1",
        },
      });

    const serviceRequest = builder.buildServiceRequest();
    const imagingStudy = builder.buildImagingStudy({
      serviceRequestId: "srv-rad-1",
    });
    const diagnosticReport = builder.buildDiagnosticReport({
      serviceRequestId: "srv-rad-1",
      imagingStudyId: "img-1",
    });

    expect(serviceRequest.subject.reference).toBe("Patient/100000030009");
    expect(serviceRequest.encounter?.reference).toBe(
      "Encounter/6694e8c8-052a-4ea6-8072-157b6d47ca08",
    );
    expect(serviceRequest.authoredOn).toBe("2024-04-01T02:45:00+00:00");

    expect(imagingStudy.subject.reference).toBe("Patient/100000030009");
    expect(imagingStudy.encounter?.reference).toBe(
      "Encounter/6694e8c8-052a-4ea6-8072-157b6d47ca08",
    );
    expect(imagingStudy.basedOn?.[0]?.reference).toBe("ServiceRequest/srv-rad-1");
    expect(imagingStudy.note?.[0]?.text).toBe("Seluruh citra berhasil diunggah ke NIDR.");
    expect(imagingStudy.series?.[0]?.uid).toBe(
      "1.2.48.670589.30.39.0.1.966169786508.1664950724077.1",
    );

    expect(diagnosticReport.subject.reference).toBe("Patient/100000030009");
    expect(diagnosticReport.encounter.reference).toBe(
      "Encounter/6694e8c8-052a-4ea6-8072-157b6d47ca08",
    );
    expect(diagnosticReport.basedOn?.[0]?.reference).toBe("ServiceRequest/srv-rad-1");
    expect(diagnosticReport.imagingStudy?.[0]?.reference).toBe("ImagingStudy/img-1");
    expect(diagnosticReport.media?.[0]?.comment).toBe("Preview axial slice");
  });

  test("keeps explicit references and shared updates in sync", () => {
    const builder = createServiceRequestImagingStudyDiagnosticReportBuilder({
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
              code: "24627-2",
            },
          ],
        },
      },
      imagingStudy: {
        identifier: [
          {
            system: "http://sys-ids.kemkes.go.id/acsn/10000004",
            use: "usual",
            value: "XR.240401.010",
          },
        ],
        status: "available",
        modality: [
          {
            system: "http://dicom.nema.org/resources/ontology/DCM",
            code: "CR",
          },
        ],
        endpoint: [
          {
            reference: "Endpoint/wado-1",
          },
        ],
      },
      diagnosticReport: {
        status: "final",
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "19005-8",
            },
          ],
        },
        imagingStudy: [
          {
            reference: "ImagingStudy/existing",
          },
        ],
      },
    })
      .setSubject({
        reference: "Patient/new",
      })
      .setEncounter({
        reference: "Encounter/new",
      })
      .mergeDiagnosticReport({
        basedOn: [
          {
            reference: "ServiceRequest/existing",
          },
        ],
      });

    const imagingStudy = builder.buildImagingStudy({
      serviceRequestReference: {
        reference: "ServiceRequest/existing",
        display: "Chest X-Ray order",
      },
    });
    const diagnosticReport = builder.buildDiagnosticReport({
      serviceRequestId: "existing",
      imagingStudyReference: {
        reference: "ImagingStudy/existing",
        display: "Chest X-Ray image set",
      },
    });

    expect(imagingStudy.subject.reference).toBe("Patient/new");
    expect(imagingStudy.encounter?.reference).toBe("Encounter/new");
    expect(imagingStudy.basedOn).toHaveLength(1);
    expect(imagingStudy.basedOn?.[0]?.reference).toBe("ServiceRequest/existing");
    expect(imagingStudy.endpoint?.[0]?.reference).toBe("Endpoint/wado-1");

    expect(diagnosticReport.subject.reference).toBe("Patient/new");
    expect(diagnosticReport.encounter.reference).toBe("Encounter/new");
    expect(diagnosticReport.basedOn).toHaveLength(1);
    expect(diagnosticReport.basedOn?.[0]?.reference).toBe("ServiceRequest/existing");
    expect(diagnosticReport.imagingStudy).toHaveLength(1);
    expect(diagnosticReport.imagingStudy?.[0]?.reference).toBe("ImagingStudy/existing");
  });

  test("requires a service request link when building imaging study", () => {
    const builder = createServiceRequestImagingStudyDiagnosticReportBuilder({
      subject: {
        reference: "Patient/100000030009",
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
              code: "24627-2",
            },
          ],
        },
      },
      imagingStudy: {
        identifier: [
          {
            system: "http://sys-ids.kemkes.go.id/acsn/10000004",
            use: "usual",
            value: "XR.240401.010",
          },
        ],
        status: "available",
        modality: [
          {
            system: "http://dicom.nema.org/resources/ontology/DCM",
            code: "CR",
          },
        ],
      },
      diagnosticReport: {
        status: "final",
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "19005-8",
            },
          ],
        },
      },
    });

    expect(() => builder.buildImagingStudy()).toThrow(
      "ImagingStudy requires a ServiceRequest link.",
    );
  });
});

import { describe, test } from "node:test";

import { createChestXRayStudyBuilder } from "../src";
import { expect } from "./helpers/expect";

describe("chest xray study builder", () => {
  test("creates a chest x-ray workflow with radiology defaults", () => {
    const builder = createChestXRayStudyBuilder({
      subject: {
        reference: "Patient/100000030009",
      },
      encounter: {
        reference: "Encounter/4f735a03-128b-464d-bf91-e6eacdf1c38f",
      },
      organizationId: "10000004",
      accessionNumber: "XR.240401.001",
    });

    const serviceRequest = builder.buildServiceRequest();
    const imagingStudy = builder.buildImagingStudy({
      serviceRequestId: "srv-xr-1",
    });
    const diagnosticReport = builder.buildDiagnosticReport({
      serviceRequestId: "srv-xr-1",
      imagingStudyId: "img-xr-1",
    });

    expect(serviceRequest.code.coding[0]?.code).toBe("42272-5");
    expect(serviceRequest.code.coding[0]?.display).toBe("XR Chest PA and Lateral");

    expect(imagingStudy.identifier[0]?.system).toBe("http://sys-ids.kemkes.go.id/acsn/10000004");
    expect(imagingStudy.identifier[0]?.value).toBe("XR.240401.001");
    expect(imagingStudy.modality[0]?.code).toBe("CR");
    expect(imagingStudy.basedOn?.[0]?.reference).toBe("ServiceRequest/srv-xr-1");
    expect(imagingStudy.description).toBe("XR Chest PA and Lateral");

    expect(diagnosticReport.status).toBe("final");
    expect(diagnosticReport.code.coding[0]?.code).toBe("42272-5");
    expect(diagnosticReport.category?.[0]?.coding?.[0]?.code).toBe("RAD");
    expect(diagnosticReport.imagingStudy?.[0]?.reference).toBe("ImagingStudy/img-xr-1");
  });

  test("allows overriding defaults for chest x-ray workflow", () => {
    const builder = createChestXRayStudyBuilder({
      subject: {
        reference: "Patient/100000030009",
      },
      encounter: {
        reference: "Encounter/4f735a03-128b-464d-bf91-e6eacdf1c38f",
      },
      organizationId: "10000004",
      accessionNumber: "XR.240401.002",
      identifierUse: "official",
      imagingStudy: {
        description: "Portable AP chest radiograph",
      },
      diagnosticReport: {
        conclusion: "Tidak tampak infiltrat aktif.",
      },
    });

    const imagingStudy = builder.buildImagingStudy({
      serviceRequestId: "srv-xr-2",
    });
    const diagnosticReport = builder.buildDiagnosticReport({
      imagingStudyReference: {
        reference: "ImagingStudy/img-xr-2",
      },
    });

    expect(imagingStudy.identifier[0]?.use).toBe("official");
    expect(imagingStudy.description).toBe("Portable AP chest radiograph");
    expect(diagnosticReport.conclusion).toBe("Tidak tampak infiltrat aktif.");
    expect(diagnosticReport.imagingStudy?.[0]?.reference).toBe("ImagingStudy/img-xr-2");
  });
});

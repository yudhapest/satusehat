import { describe, test } from "node:test";

import { createCompleteBloodCountPanelBuilder } from "../src";
import { expect } from "./helpers/expect";

describe("complete blood count panel builder", () => {
  test("creates a CBC workflow with default observations and auto-units", () => {
    const builder = createCompleteBloodCountPanelBuilder({
      subject: {
        reference: "Patient/100000030009",
      },
      encounter: {
        reference: "Encounter/4f735a03-128b-464d-bf91-e6eacdf1c38f",
      },
      results: {
        wbc: 7.2,
        rbc: 4.8,
        hemoglobin: 13.5,
        hematocrit: 41,
        mcv: 86,
        mch: 28,
        mchc: 33,
        platelets: 280,
        rdw: 12.4,
      },
    });

    const serviceRequest = builder.buildServiceRequest();
    const specimen = builder.buildSpecimen({
      serviceRequestId: "srv-cbc-1",
    });
    const observations = builder.buildObservationEntries({
      serviceRequestId: "srv-cbc-1",
      specimenId: "spm-cbc-1",
    });
    const diagnosticReport = builder.buildDiagnosticReport({
      serviceRequestId: "srv-cbc-1",
      specimenId: "spm-cbc-1",
      resultIds: observations.map((_, index) => `obs-${index + 1}`),
    });

    expect(serviceRequest.code.coding[0]?.code).toBe("58410-2");
    expect(serviceRequest.category?.[0]?.coding?.[0]?.code).toBe("laboratory");
    expect(specimen.type.coding[0]?.code).toBe("119297000");

    expect(builder.listObservationKeys()).toEqual([
      "wbc",
      "rbc",
      "hemoglobin",
      "hematocrit",
      "mcv",
      "mch",
      "mchc",
      "platelets",
      "rdw",
    ]);

    const hemoglobin = observations.find((item) => item.key === "hemoglobin");
    const platelets = observations.find((item) => item.key === "platelets");
    const rdw = observations.find((item) => item.key === "rdw");

    expect(hemoglobin?.body.valueQuantity?.value).toBe(13.5);
    expect(hemoglobin?.body.valueQuantity?.unit).toBe("g/dL");
    expect(platelets?.body.valueQuantity?.code).toBe("10*3/uL");
    expect(rdw?.body.valueQuantity?.unit).toBe("%");

    expect(diagnosticReport.code.coding[0]?.code).toBe("58410-2");
    expect(diagnosticReport.result).toHaveLength(observations.length);
    expect(diagnosticReport.result?.[0]?.reference).toBe("Observation/obs-1");
  });

  test("includes optional CBC observations on demand", () => {
    const builder = createCompleteBloodCountPanelBuilder({
      subject: {
        reference: "Patient/100000030009",
      },
      encounter: {
        reference: "Encounter/4f735a03-128b-464d-bf91-e6eacdf1c38f",
      },
      includeOptionalObservations: true,
    });

    expect(builder.listObservationKeys()).toEqual([
      "wbc",
      "rbc",
      "hemoglobin",
      "hematocrit",
      "mcv",
      "mch",
      "mchc",
      "platelets",
      "rdw",
      "pdw",
      "mpv",
    ]);
  });
});

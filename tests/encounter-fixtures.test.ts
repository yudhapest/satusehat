import { describe, test } from "node:test";

import { EncounterCreateSchema } from "../src/schemas/encounter";
import {
  createEncounterFixture,
  encounterFixtureUseCases,
} from "./fixtures/encounter";
import { expect } from "./helpers/expect";

describe("encounter fixtures", () => {
  test("provide schema-valid SATUSEHAT payloads for outpatient, inpatient, and emergency use cases", () => {
    for (const useCase of encounterFixtureUseCases) {
      const parsed = EncounterCreateSchema.parse(createEncounterFixture(useCase));

      expect(parsed.resourceType).toBe("Encounter");
      expect(parsed.identifier.length).toBeGreaterThan(0);
      expect(parsed.statusHistory.length).toBeGreaterThan(0);
      expect(parsed.classHistory.length).toBeGreaterThan(0);
      expect(parsed.diagnosis).toBeDefined();
      if (!parsed.diagnosis) {
        throw new Error("Expected encounter fixture to include diagnosis");
      }
      expect(parsed.diagnosis.length).toBeGreaterThan(0);
      expect(parsed.location.length).toBeGreaterThan(0);
    }
  });

  test("covers outpatient-specific fields used in poli/rawat jalan", () => {
    const outpatient = createEncounterFixture("outpatient");

    expect(outpatient.serviceType?.coding?.[0]?.code).toBe("poli-interna");
    expect(outpatient.priority?.coding?.[0]?.code).toBe("R");
    expect(outpatient.participant).toHaveLength(2);
    expect(outpatient.location[0]?.location.reference).toBe("Location/poli-interna");
  });

  test("covers inpatient-specific hospitalization and service class fields", () => {
    const inpatient = createEncounterFixture("inpatient");

    expect(inpatient.hospitalization?.admitSource?.coding?.[0]?.code).toBe("emd");
    expect(inpatient.hospitalization?.destination?.reference).toBe(
      "Location/home-care-transition",
    );
    expect(inpatient.hospitalization?.dischargeDisposition?.coding?.[0]?.code).toBe("home");
    expect(inpatient.location[0]?.extension?.[0]).toEqual({
      url: "https://fhir.kemkes.go.id/r4/StructureDefinition/serviceClass",
      extension: [
        {
          url: "valueCode",
          valueCode: "kelas-1",
        },
      ],
    });
  });

  test("covers emergency triage progression and multi-location flow", () => {
    const emergency = createEncounterFixture("emergency");

    expect(emergency.statusHistory.map((entry) => entry.status)).toEqual([
      "arrived",
      "triaged",
      "in-progress",
    ]);
    expect(emergency.serviceType?.coding?.[0]?.code).toBe("igd");
    expect(emergency.priority?.coding?.[0]?.code).toBe("A");
    expect(emergency.location).toHaveLength(2);
    expect(emergency.location[0]?.status).toBe("completed");
    expect(emergency.location[1]?.status).toBe("active");
  });

  test("rejects inpatient payloads with invalid hospitalization coding systems", () => {
    const inpatient = createEncounterFixture("inpatient");
    (
      inpatient.hospitalization!.admitSource!.coding![0] as {
        system: string;
      }
    ).system = "http://example.com/admit-source";

    expect(() => EncounterCreateSchema.parse(inpatient)).toThrow(
      "http://terminology.hl7.org/CodeSystem/admit-source",
    );
  });

  test("rejects serviceClass extensions that omit the structured valueCode", () => {
    const inpatient = createEncounterFixture("inpatient");
    inpatient.location[0]!.extension = [
      {
        url: "https://fhir.kemkes.go.id/r4/StructureDefinition/serviceClass",
      } as never,
    ];

    expect(() => EncounterCreateSchema.parse(inpatient)).toThrow(
      "serviceClass extension must include a structured valueCode entry",
    );
  });
});

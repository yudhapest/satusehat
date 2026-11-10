import { describe, test } from "node:test";

import {
  createEncounterBuilder,
  createServiceRequestSpecimenObservationBuilder,
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

describe("encounter builder integration", () => {
  test("reuses encounter subject and created encounter reference in downstream builders", () => {
    const fixture = createEncounterFixture("outpatient");
    const encounterDraft = createEncounterBuilder({
      preset: "outpatient",
      ...toBuilderInput(fixture),
    }).build();

    const createdEncounter = {
      id: "enc-123",
      ...encounterDraft,
    };

    const downstreamBuilder = createServiceRequestSpecimenObservationBuilder({
      subject: encounterDraft.subject,
      encounter: {
        reference: `Encounter/${createdEncounter.id}`,
      },
      serviceRequest: {
        status: "active",
        intent: "order",
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
      specimen: {
        status: "available",
        type: {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "122555007",
              display: "Venous blood specimen",
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
    });

    const serviceRequest = downstreamBuilder.buildServiceRequest();
    const observation = downstreamBuilder.buildObservation({
      serviceRequestId: "srv-1",
      specimenId: "spm-1",
    });

    expect(serviceRequest.subject).toEqual(encounterDraft.subject);
    expect(serviceRequest.encounter?.reference).toBe("Encounter/enc-123");
    expect(observation.subject).toEqual(encounterDraft.subject);
    expect(observation.encounter.reference).toBe("Encounter/enc-123");
  });
});

import type { Reference } from "../schemas/common";
import type { ConditionCreateInput } from "../schemas/condition";
import type {
  EncounterCreateInput,
  EncounterLocation,
  EncounterParticipant,
  EncounterStatus,
} from "../schemas/encounter";
import {
  EncounterBuilder,
  createEncounterBuilder,
  createEncounterClassFromConsultationMethod,
  createEncounterIdentifier,
  createEncounterLocation,
  createEncounterParticipant,
  createEncounterServiceProviderReference,
  createEncounterStatusTimeline,
  type EncounterConsultationMethod,
  type EncounterLocationHelperInput,
  type EncounterParticipantHelperInput,
  type EncounterStatusTimelineInput,
} from "./encounter-builder";
import {
  createEncounterDiagnosis,
  createEncounterConditionBuilder,
  type EncounterConditionBuilder,
  type EncounterConditionBuilderInput,
  type EncounterDiagnosisBuildLinks,
} from "./encounter-condition-builder";

type EncounterQueueMutableInput = Partial<
  Omit<
    EncounterCreateInput,
    | "resourceType"
    | "identifier"
    | "status"
    | "statusHistory"
    | "class"
    | "classHistory"
    | "subject"
    | "period"
    | "location"
    | "serviceProvider"
    | "diagnosis"
  >
>;

type EncounterQueueParticipantInput =
  | EncounterParticipant
  | EncounterParticipantHelperInput;

type EncounterQueueLocationInput = EncounterLocation | EncounterLocationHelperInput;

export interface EncounterQueueBuilderInput {
  organizationId: string;
  registrationId: string;
  subject: Reference;
  statusTimeline: EncounterStatusTimelineInput;
  location: EncounterQueueLocationInput | EncounterQueueLocationInput[];
  participants?: EncounterQueueParticipantInput | EncounterQueueParticipantInput[];
  consultationMethod?: EncounterConsultationMethod;
  serviceProviderDisplay?: string;
  encounter?: EncounterQueueMutableInput;
  condition?: EncounterConditionBuilderInput["condition"];
}

export class EncounterQueueBuilder {
  private readonly subject: Reference;
  private readonly organizationId: string;
  private readonly registrationId: string;
  private readonly consultationMethod: EncounterConsultationMethod;
  private readonly serviceProviderDisplay?: string | undefined;
  private readonly statusTimeline: EncounterStatusTimelineInput;
  private readonly locations: EncounterLocation[];
  private readonly participants: EncounterParticipant[];
  private readonly encounterInput: EncounterQueueMutableInput;
  private readonly conditionInput?: EncounterConditionBuilderInput["condition"] | undefined;

  public constructor(input: EncounterQueueBuilderInput) {
    this.subject = input.subject;
    this.organizationId = input.organizationId;
    this.registrationId = input.registrationId;
    this.consultationMethod = input.consultationMethod ?? "RAJAL";
    this.serviceProviderDisplay = input.serviceProviderDisplay;
    this.statusTimeline = input.statusTimeline;
    this.locations = normalizeLocations(input.location);
    this.participants = input.participants ? normalizeParticipants(input.participants) : [];
    this.encounterInput = input.encounter ?? {};
    this.conditionInput = input.condition;
  }

  public listEncounterStages(): EncounterStatus[] {
    return this.statusTimeline.stages.map((stage) => stage.status);
  }

  public buildEncounter(): EncounterCreateInput {
    const lastStage = this.statusTimeline.stages[this.statusTimeline.stages.length - 1]!;
    return this.buildEncounterAtStage(lastStage.status);
  }

  public buildEncounterAtStage(status: EncounterStatus): EncounterCreateInput {
    const builder = this.createEncounterBuilderForStage(status);
    return builder.build();
  }

  public buildEncounterWithDiagnosis(
    links: EncounterDiagnosisBuildLinks,
  ): EncounterCreateInput {
    const lastStage = this.statusTimeline.stages[this.statusTimeline.stages.length - 1]!;
    return this.buildEncounterAtStageWithDiagnosis(lastStage.status, links);
  }

  public buildEncounterAtStageWithDiagnosis(
    status: EncounterStatus,
    links: EncounterDiagnosisBuildLinks,
  ): EncounterCreateInput {
    const builder = this.createEncounterBuilderForStage(status);
    builder.addDiagnosis(createEncounterDiagnosis(links));
    return builder.build();
  }

  public createConditionBuilder(
    encounterId: string,
    encounterDisplay?: string,
  ): EncounterConditionBuilder {
    if (!this.conditionInput) {
      throw new Error(
        "Condition input is not configured. Provide condition in createEncounterQueueBuilder(...) before building Condition.",
      );
    }

    return createEncounterConditionBuilder({
      subject: this.subject,
      encounter: {
        reference: `Encounter/${encounterId}`,
        ...(encounterDisplay ? { display: encounterDisplay } : {}),
      },
      condition: this.conditionInput,
    });
  }

  public buildCondition(encounterId: string, encounterDisplay?: string): ConditionCreateInput {
    return this.createConditionBuilder(encounterId, encounterDisplay).buildCondition();
  }

  private createEncounterBuilderForStage(status: EncounterStatus): EncounterBuilder {
    const stageIndex = this.statusTimeline.stages.findIndex((stage) => stage.status === status);

    if (stageIndex === -1) {
      throw new Error(`Encounter status "${status}" was not found in the configured timeline.`);
    }

    const stages = this.statusTimeline.stages.slice(0, stageIndex + 1);
    const periodEnd =
      this.statusTimeline.stages[stageIndex + 1]?.start ?? this.statusTimeline.periodEnd;
    const timeline = createEncounterStatusTimeline({
      stages: [
        stages[0]!,
        ...stages.slice(1),
      ],
      ...(periodEnd ? { periodEnd } : {}),
    });
    const encounterClass = createEncounterClassFromConsultationMethod(this.consultationMethod);

    return createEncounterBuilder({
      encounterClass,
      identifier: createEncounterIdentifier(this.organizationId, this.registrationId),
      status: timeline.status,
      statusHistory: timeline.statusHistory,
      classHistory: [
        {
          class: encounterClass,
          period: timeline.period,
        },
      ],
      subject: this.subject,
      period: timeline.period,
      location: this.locations,
      serviceProvider: createEncounterServiceProviderReference(
        this.organizationId,
        this.serviceProviderDisplay,
      ),
      ...(this.participants.length > 0 ? { participant: this.participants } : {}),
      ...omitUndefined(this.encounterInput),
    });
  }
}

export function createEncounterQueueBuilder(
  input: EncounterQueueBuilderInput,
): EncounterQueueBuilder {
  return new EncounterQueueBuilder(input);
}

function normalizeParticipants(
  input: EncounterQueueParticipantInput | EncounterQueueParticipantInput[],
): EncounterParticipant[] {
  const items = Array.isArray(input) ? input : [input];
  return items.map((item) =>
    "practitionerId" in item ? createEncounterParticipant(item) : item,
  );
}

function normalizeLocations(
  input: EncounterQueueLocationInput | EncounterQueueLocationInput[],
): EncounterLocation[] {
  const items = Array.isArray(input) ? input : [input];
  return items.map((item) => ("locationId" in item ? createEncounterLocation(item) : item));
}

function omitUndefined(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
}

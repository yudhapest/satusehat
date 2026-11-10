import { z } from "zod";

import { type Transport } from "../client/transport";
import {
  EncounterBundleSchema,
  EncounterSubmitSchema,
  EncounterPatchSchema,
  EncounterSchema,
  EncounterSearchParamsSchema,
  EncounterUpdateParamsSchema,
  EncounterUpdateSchema,
} from "../schemas/encounter";
import type {
  EncounterCreateInput,
  EncounterPatchInput,
  EncounterSearchParams,
  EncounterUpdateInput,
} from "../schemas/encounter";

const EncounterIdParamsSchema = z.object({
  id: z.string().min(1),
});

export function createEncounterClient(transport: Transport) {
  return {
    create(input: EncounterCreateInput, signal?: AbortSignal) {
      return transport.request({
        method: "POST",
        path: "/Encounter",
        body: input,
        bodySchema: EncounterSubmitSchema,
        responseSchema: EncounterSchema,
        ...(signal ? { signal } : {}),
      });
    },

    getById(input: { id: string; signal?: AbortSignal }) {
      const parsed = EncounterIdParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "GET",
        path: `/Encounter/${parsed.id}`,
        responseSchema: EncounterSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    search(input: EncounterSearchParams, signal?: AbortSignal) {
      return transport.request({
        method: "GET",
        path: "/Encounter",
        query: input,
        querySchema: EncounterSearchParamsSchema,
        responseSchema: EncounterBundleSchema,
        ...(signal ? { signal } : {}),
      });
    },

    patch(input: { id: string; body: EncounterPatchInput; signal?: AbortSignal }) {
      const params = EncounterUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PATCH",
        path: `/Encounter/${params.id}`,
        body: input.body,
        bodySchema: EncounterPatchSchema,
        responseSchema: EncounterSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    update(input: { id: string; body: EncounterUpdateInput; signal?: AbortSignal }) {
      const params = EncounterUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PUT",
        path: `/Encounter/${params.id}`,
        body: input.body,
        bodySchema: EncounterUpdateSchema,
        resourceId: params.id,
        responseSchema: EncounterSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },
  };
}

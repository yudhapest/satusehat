import { z } from "zod";

import { type Transport } from "../client/transport";
import {
  ObservationBundleSchema,
  ObservationSubmitSchema,
  ObservationPatchSchema,
  ObservationSchema,
  ObservationSearchParamsSchema,
  ObservationUpdateParamsSchema,
} from "../schemas/observation";
import type {
  ObservationCreateInput,
  ObservationPatchInput,
  ObservationSearchParams,
} from "../schemas/observation";

const ObservationIdParamsSchema = z.object({
  id: z.string().min(1),
});

export function createObservationClient(transport: Transport) {
  return {
    create(input: ObservationCreateInput, signal?: AbortSignal) {
      return transport.request({
        method: "POST",
        path: "/Observation",
        body: input,
        bodySchema: ObservationSubmitSchema,
        responseSchema: ObservationSchema,
        ...(signal ? { signal } : {}),
      });
    },

    getById(input: { id: string; signal?: AbortSignal }) {
      const parsed = ObservationIdParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "GET",
        path: `/Observation/${parsed.id}`,
        responseSchema: ObservationSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    search(input: ObservationSearchParams, signal?: AbortSignal) {
      return transport.request({
        method: "GET",
        path: "/Observation",
        query: input,
        querySchema: ObservationSearchParamsSchema,
        responseSchema: ObservationBundleSchema,
        ...(signal ? { signal } : {}),
      });
    },

    patch(input: { id: string; body: ObservationPatchInput; signal?: AbortSignal }) {
      const params = ObservationUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PATCH",
        path: `/Observation/${params.id}`,
        body: input.body,
        bodySchema: ObservationPatchSchema,
        responseSchema: ObservationSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    update(input: { id: string; body: ObservationCreateInput; signal?: AbortSignal }) {
      const params = ObservationUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PUT",
        path: `/Observation/${params.id}`,
        body: input.body,
        bodySchema: ObservationSubmitSchema,
        resourceId: params.id,
        responseSchema: ObservationSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },
  };
}

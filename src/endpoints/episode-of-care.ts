import { z } from "zod";

import { type Transport } from "../client/transport";
import {
  EpisodeOfCareBundleSchema,
  EpisodeOfCareCreateSchema,
  EpisodeOfCarePatchSchema,
  EpisodeOfCareSchema,
  EpisodeOfCareSearchParamsSchema,
  EpisodeOfCareUpdateParamsSchema,
} from "../schemas/episode-of-care";
import type {
  EpisodeOfCareCreateInput,
  EpisodeOfCarePatchInput,
  EpisodeOfCareSearchParams,
} from "../schemas/episode-of-care";

const EpisodeOfCareIdParamsSchema = z.object({
  id: z.string().min(1),
});

export function createEpisodeOfCareClient(transport: Transport) {
  return {
    create(input: EpisodeOfCareCreateInput, signal?: AbortSignal) {
      return transport.request({
        method: "POST",
        path: "/EpisodeOfCare",
        body: input,
        bodySchema: EpisodeOfCareCreateSchema,
        responseSchema: EpisodeOfCareSchema,
        ...(signal ? { signal } : {}),
      });
    },

    getById(input: { id: string; signal?: AbortSignal }) {
      const parsed = EpisodeOfCareIdParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "GET",
        path: `/EpisodeOfCare/${parsed.id}`,
        responseSchema: EpisodeOfCareSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    search(input: EpisodeOfCareSearchParams, signal?: AbortSignal) {
      return transport.request({
        method: "GET",
        path: "/EpisodeOfCare",
        query: input,
        querySchema: EpisodeOfCareSearchParamsSchema,
        responseSchema: EpisodeOfCareBundleSchema,
        ...(signal ? { signal } : {}),
      });
    },

    patch(input: { id: string; body: EpisodeOfCarePatchInput; signal?: AbortSignal }) {
      const params = EpisodeOfCareUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PATCH",
        path: `/EpisodeOfCare/${params.id}`,
        body: input.body,
        bodySchema: EpisodeOfCarePatchSchema,
        responseSchema: EpisodeOfCareSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    update(input: { id: string; body: EpisodeOfCareCreateInput; signal?: AbortSignal }) {
      const params = EpisodeOfCareUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PUT",
        path: `/EpisodeOfCare/${params.id}`,
        body: input.body,
        bodySchema: EpisodeOfCareCreateSchema,
        resourceId: params.id,
        responseSchema: EpisodeOfCareSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },
  };
}

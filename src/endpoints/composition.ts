import { z } from "zod";

import { type Transport } from "../client/transport";
import type { CompositionClient } from "../core/types";
import {
  CompositionBundleSchema,
  CompositionCreateSchema,
  CompositionPatchSchema,
  CompositionSchema,
  CompositionSearchParamsSchema,
  CompositionUpdateParamsSchema,
} from "../schemas/composition";
import type {
  CompositionCreateInput,
  CompositionPatchInput,
  CompositionSearchParams,
} from "../schemas/composition";

const CompositionIdParamsSchema = z.object({
  id: z.string().min(1),
});

export function createCompositionClient(transport: Transport): CompositionClient {
  return {
    create(input: CompositionCreateInput, signal?: AbortSignal) {
      return transport.request({
        method: "POST",
        path: "/Composition",
        body: input,
        bodySchema: CompositionCreateSchema,
        responseSchema: CompositionSchema,
        ...(signal ? { signal } : {}),
      });
    },

    getById(input: { id: string; signal?: AbortSignal }) {
      const parsed = CompositionIdParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "GET",
        path: `/Composition/${parsed.id}`,
        responseSchema: CompositionSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    search(input: CompositionSearchParams, signal?: AbortSignal) {
      return transport.request({
        method: "GET",
        path: "/Composition",
        query: input,
        querySchema: CompositionSearchParamsSchema,
        responseSchema: CompositionBundleSchema,
        ...(signal ? { signal } : {}),
      });
    },

    patch(input: { id: string; body: CompositionPatchInput; signal?: AbortSignal }) {
      const params = CompositionUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PATCH",
        path: `/Composition/${params.id}`,
        body: input.body,
        bodySchema: CompositionPatchSchema,
        responseSchema: CompositionSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    update(input: { id: string; body: CompositionCreateInput; signal?: AbortSignal }) {
      const params = CompositionUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PUT",
        path: `/Composition/${params.id}`,
        body: input.body,
        bodySchema: CompositionCreateSchema,
        resourceId: params.id,
        responseSchema: CompositionSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },
  };
}

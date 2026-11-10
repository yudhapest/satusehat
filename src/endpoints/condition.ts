import { z } from "zod";

import { type Transport } from "../client/transport";
import {
  ConditionBundleSchema,
  ConditionCreateSchema,
  ConditionPatchSchema,
  ConditionSchema,
  ConditionSearchParamsSchema,
  ConditionUpdateParamsSchema,
} from "../schemas/condition";
import type {
  ConditionCreateInput,
  ConditionPatchInput,
  ConditionSearchParams,
} from "../schemas/condition";

const ConditionIdParamsSchema = z.object({
  id: z.string().min(1),
});

export function createConditionClient(transport: Transport) {
  return {
    create(input: ConditionCreateInput, signal?: AbortSignal) {
      return transport.request({
        method: "POST",
        path: "/Condition",
        body: input,
        bodySchema: ConditionCreateSchema,
        responseSchema: ConditionSchema,
        ...(signal ? { signal } : {}),
      });
    },

    getById(input: { id: string; signal?: AbortSignal }) {
      const parsed = ConditionIdParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "GET",
        path: `/Condition/${parsed.id}`,
        responseSchema: ConditionSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    search(input: ConditionSearchParams, signal?: AbortSignal) {
      return transport.request({
        method: "GET",
        path: "/Condition",
        query: input,
        querySchema: ConditionSearchParamsSchema,
        responseSchema: ConditionBundleSchema,
        ...(signal ? { signal } : {}),
      });
    },

    patch(input: { id: string; body: ConditionPatchInput; signal?: AbortSignal }) {
      const params = ConditionUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PATCH",
        path: `/Condition/${params.id}`,
        body: input.body,
        bodySchema: ConditionPatchSchema,
        responseSchema: ConditionSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    update(input: { id: string; body: ConditionCreateInput; signal?: AbortSignal }) {
      const params = ConditionUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PUT",
        path: `/Condition/${params.id}`,
        body: input.body,
        bodySchema: ConditionCreateSchema,
        resourceId: params.id,
        responseSchema: ConditionSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },
  };
}

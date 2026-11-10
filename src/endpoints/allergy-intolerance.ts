import { z } from "zod";

import { type Transport } from "../client/transport";
import {
  AllergyIntoleranceBundleSchema,
  AllergyIntoleranceCreateSchema,
  AllergyIntolerancePatchSchema,
  AllergyIntoleranceSchema,
  AllergyIntoleranceSearchParamsSchema,
  AllergyIntoleranceUpdateParamsSchema,
} from "../schemas/allergy-intolerance";
import type {
  AllergyIntoleranceCreateInput,
  AllergyIntolerancePatchInput,
  AllergyIntoleranceSearchParams,
} from "../schemas/allergy-intolerance";

const AllergyIntoleranceIdParamsSchema = z.object({
  id: z.string().min(1),
});

export function createAllergyIntoleranceClient(transport: Transport) {
  return {
    create(input: AllergyIntoleranceCreateInput, signal?: AbortSignal) {
      return transport.request({
        method: "POST",
        path: "/AllergyIntolerance",
        body: input,
        bodySchema: AllergyIntoleranceCreateSchema,
        responseSchema: AllergyIntoleranceSchema,
        ...(signal ? { signal } : {}),
      });
    },

    getById(input: { id: string; signal?: AbortSignal }) {
      const parsed = AllergyIntoleranceIdParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "GET",
        path: `/AllergyIntolerance/${parsed.id}`,
        responseSchema: AllergyIntoleranceSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    search(input: AllergyIntoleranceSearchParams, signal?: AbortSignal) {
      return transport.request({
        method: "GET",
        path: "/AllergyIntolerance",
        query: input,
        querySchema: AllergyIntoleranceSearchParamsSchema,
        responseSchema: AllergyIntoleranceBundleSchema,
        ...(signal ? { signal } : {}),
      });
    },

    patch(input: { id: string; body: AllergyIntolerancePatchInput; signal?: AbortSignal }) {
      const params = AllergyIntoleranceUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PATCH",
        path: `/AllergyIntolerance/${params.id}`,
        body: input.body,
        bodySchema: AllergyIntolerancePatchSchema,
        responseSchema: AllergyIntoleranceSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    update(input: { id: string; body: AllergyIntoleranceCreateInput; signal?: AbortSignal }) {
      const params = AllergyIntoleranceUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PUT",
        path: `/AllergyIntolerance/${params.id}`,
        body: input.body,
        bodySchema: AllergyIntoleranceCreateSchema,
        resourceId: params.id,
        responseSchema: AllergyIntoleranceSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },
  };
}

import { z } from "zod";

import { type Transport } from "../client/transport";
import { SatuSehatValidationError } from "../core/errors";
import {
  NutritionOrderBundleSchema,
  NutritionOrderCreateSchema,
  NutritionOrderNormalizedSearchParamsSchema,
  NutritionOrderPatchSchema,
  NutritionOrderSchema,
  NutritionOrderSearchParamsSchema,
  NutritionOrderUpdateParamsSchema,
} from "../schemas/nutrition-order";
import type {
  NutritionOrderCreateInput,
  NutritionOrderPatchInput,
  NutritionOrderSearchParams,
} from "../schemas/nutrition-order";

const NutritionOrderIdParamsSchema = z.object({
  id: z.string().min(1),
});

export function createNutritionOrderClient(transport: Transport) {
  return {
    create(input: NutritionOrderCreateInput, signal?: AbortSignal) {
      return transport.request({
        method: "POST",
        path: "/NutritionOrder",
        body: input,
        bodySchema: NutritionOrderCreateSchema,
        responseSchema: NutritionOrderSchema,
        ...(signal ? { signal } : {}),
      });
    },

    getById(input: { id: string; signal?: AbortSignal }) {
      const parsed = NutritionOrderIdParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "GET",
        path: `/NutritionOrder/${parsed.id}`,
        responseSchema: NutritionOrderSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    search(input: NutritionOrderSearchParams, signal?: AbortSignal) {
      const query = NutritionOrderSearchParamsSchema.safeParse(input);

      if (!query.success) {
        throw new SatuSehatValidationError(
          "SATUSEHAT request query validation failed",
          query.error.issues,
        );
      }

      const normalizedQuery = query.data.patient
        ? {
            patient: query.data.patient,
            ...(query.data.encounter ? { encounter: query.data.encounter } : {}),
          }
        : query.data.subject
          ? {
              patient: query.data.subject,
              ...(query.data.encounter ? { encounter: query.data.encounter } : {}),
            }
          : {
              ...(query.data.encounter ? { encounter: query.data.encounter } : {}),
            };

      return transport.request({
        method: "GET",
        path: "/NutritionOrder",
        query: normalizedQuery,
        querySchema: NutritionOrderNormalizedSearchParamsSchema,
        responseSchema: NutritionOrderBundleSchema,
        ...(signal ? { signal } : {}),
      });
    },

    patch(input: { id: string; body: NutritionOrderPatchInput; signal?: AbortSignal }) {
      const params = NutritionOrderUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PATCH",
        path: `/NutritionOrder/${params.id}`,
        body: input.body,
        bodySchema: NutritionOrderPatchSchema,
        responseSchema: NutritionOrderSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    update(input: { id: string; body: NutritionOrderCreateInput; signal?: AbortSignal }) {
      const params = NutritionOrderUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PUT",
        path: `/NutritionOrder/${params.id}`,
        body: input.body,
        bodySchema: NutritionOrderCreateSchema,
        resourceId: params.id,
        responseSchema: NutritionOrderSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },
  };
}

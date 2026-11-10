import { z } from "zod";

import { type Transport } from "../client/transport";
import { SatuSehatValidationError } from "../core/errors";
import {
  CarePlanBundleSchema,
  CarePlanCreateSchema,
  CarePlanNormalizedSearchParamsSchema,
  CarePlanPatchSchema,
  CarePlanSchema,
  CarePlanSearchParamsSchema,
  CarePlanUpdateParamsSchema,
} from "../schemas/care-plan";
import type {
  CarePlanCreateInput,
  CarePlanPatchInput,
  CarePlanSearchParams,
} from "../schemas/care-plan";

const CarePlanIdParamsSchema = z.object({
  id: z.string().min(1),
});

export function createCarePlanClient(transport: Transport) {
  return {
    create(input: CarePlanCreateInput, signal?: AbortSignal) {
      return transport.request({
        method: "POST",
        path: "/CarePlan",
        body: input,
        bodySchema: CarePlanCreateSchema,
        responseSchema: CarePlanSchema,
        ...(signal ? { signal } : {}),
      });
    },

    getById(input: { id: string; signal?: AbortSignal }) {
      const parsed = CarePlanIdParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "GET",
        path: `/CarePlan/${parsed.id}`,
        responseSchema: CarePlanSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    search(input: CarePlanSearchParams, signal?: AbortSignal) {
      const query = CarePlanSearchParamsSchema.safeParse(input);

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
        path: "/CarePlan",
        query: normalizedQuery,
        querySchema: CarePlanNormalizedSearchParamsSchema,
        responseSchema: CarePlanBundleSchema,
        ...(signal ? { signal } : {}),
      });
    },

    patch(input: { id: string; body: CarePlanPatchInput; signal?: AbortSignal }) {
      const params = CarePlanUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PATCH",
        path: `/CarePlan/${params.id}`,
        body: input.body,
        bodySchema: CarePlanPatchSchema,
        responseSchema: CarePlanSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    update(input: { id: string; body: CarePlanCreateInput; signal?: AbortSignal }) {
      const params = CarePlanUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PUT",
        path: `/CarePlan/${params.id}`,
        body: input.body,
        bodySchema: CarePlanCreateSchema,
        resourceId: params.id,
        responseSchema: CarePlanSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },
  };
}

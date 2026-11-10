import { z } from "zod";

import { type Transport } from "../client/transport";
import {
  ServiceRequestBundleSchema,
  ServiceRequestCreateSchema,
  ServiceRequestPatchSchema,
  ServiceRequestSchema,
  ServiceRequestSearchParamsSchema,
  ServiceRequestUpdateParamsSchema,
} from "../schemas/service-request";
import type {
  ServiceRequestCreateInput,
  ServiceRequestPatchInput,
  ServiceRequestSearchParams,
} from "../schemas/service-request";

const ServiceRequestIdParamsSchema = z.object({
  id: z.string().min(1),
});

export function createServiceRequestClient(transport: Transport) {
  return {
    create(input: ServiceRequestCreateInput, signal?: AbortSignal) {
      return transport.request({
        method: "POST",
        path: "/ServiceRequest",
        body: input,
        bodySchema: ServiceRequestCreateSchema,
        responseSchema: ServiceRequestSchema,
        ...(signal ? { signal } : {}),
      });
    },

    getById(input: { id: string; signal?: AbortSignal }) {
      const parsed = ServiceRequestIdParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "GET",
        path: `/ServiceRequest/${parsed.id}`,
        responseSchema: ServiceRequestSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    search(input: ServiceRequestSearchParams, signal?: AbortSignal) {
      return transport.request({
        method: "GET",
        path: "/ServiceRequest",
        query: input,
        querySchema: ServiceRequestSearchParamsSchema,
        responseSchema: ServiceRequestBundleSchema,
        ...(signal ? { signal } : {}),
      });
    },

    patch(input: { id: string; body: ServiceRequestPatchInput; signal?: AbortSignal }) {
      const params = ServiceRequestUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PATCH",
        path: `/ServiceRequest/${params.id}`,
        body: input.body,
        bodySchema: ServiceRequestPatchSchema,
        responseSchema: ServiceRequestSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    update(input: { id: string; body: ServiceRequestCreateInput; signal?: AbortSignal }) {
      const params = ServiceRequestUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PUT",
        path: `/ServiceRequest/${params.id}`,
        body: input.body,
        bodySchema: ServiceRequestCreateSchema,
        resourceId: params.id,
        responseSchema: ServiceRequestSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },
  };
}

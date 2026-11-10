import { z } from "zod";

import { type Transport } from "../client/transport";
import {
  MedicationRequestBundleSchema,
  MedicationRequestCreateSchema,
  MedicationRequestPatchSchema,
  MedicationRequestSchema,
  MedicationRequestSearchParamsSchema,
  MedicationRequestUpdateParamsSchema,
} from "../schemas/medication-request";
import type {
  MedicationRequestCreateInput,
  MedicationRequestPatchInput,
  MedicationRequestSearchParams,
} from "../schemas/medication-request";

const MedicationRequestIdParamsSchema = z.object({
  id: z.string().min(1),
});

export function createMedicationRequestClient(transport: Transport) {
  return {
    create(input: MedicationRequestCreateInput, signal?: AbortSignal) {
      return transport.request({
        method: "POST",
        path: "/MedicationRequest",
        body: input,
        bodySchema: MedicationRequestCreateSchema,
        responseSchema: MedicationRequestSchema,
        ...(signal ? { signal } : {}),
      });
    },

    getById(input: { id: string; signal?: AbortSignal }) {
      const parsed = MedicationRequestIdParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "GET",
        path: `/MedicationRequest/${parsed.id}`,
        responseSchema: MedicationRequestSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    search(input: MedicationRequestSearchParams, signal?: AbortSignal) {
      return transport.request({
        method: "GET",
        path: "/MedicationRequest",
        query: input,
        querySchema: MedicationRequestSearchParamsSchema,
        responseSchema: MedicationRequestBundleSchema,
        ...(signal ? { signal } : {}),
      });
    },

    patch(input: { id: string; body: MedicationRequestPatchInput; signal?: AbortSignal }) {
      const params = MedicationRequestUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PATCH",
        path: `/MedicationRequest/${params.id}`,
        body: input.body,
        bodySchema: MedicationRequestPatchSchema,
        responseSchema: MedicationRequestSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    update(input: { id: string; body: MedicationRequestCreateInput; signal?: AbortSignal }) {
      const params = MedicationRequestUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PUT",
        path: `/MedicationRequest/${params.id}`,
        body: input.body,
        bodySchema: MedicationRequestCreateSchema,
        resourceId: params.id,
        responseSchema: MedicationRequestSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },
  };
}

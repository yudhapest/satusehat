import { z } from "zod";

import { type Transport } from "../client/transport";
import {
  MedicationAdministrationBundleSchema,
  MedicationAdministrationCreateSchema,
  MedicationAdministrationPatchSchema,
  MedicationAdministrationSchema,
  MedicationAdministrationSearchParamsSchema,
  MedicationAdministrationUpdateParamsSchema,
} from "../schemas/medication-administration";
import type {
  MedicationAdministrationCreateInput,
  MedicationAdministrationPatchInput,
  MedicationAdministrationSearchParams,
} from "../schemas/medication-administration";

const MedicationAdministrationIdParamsSchema = z.object({
  id: z.string().min(1),
});

export function createMedicationAdministrationClient(transport: Transport) {
  return {
    create(input: MedicationAdministrationCreateInput, signal?: AbortSignal) {
      return transport.request({
        method: "POST",
        path: "/MedicationAdministration",
        body: input,
        bodySchema: MedicationAdministrationCreateSchema,
        responseSchema: MedicationAdministrationSchema,
        ...(signal ? { signal } : {}),
      });
    },

    getById(input: { id: string; signal?: AbortSignal }) {
      const parsed = MedicationAdministrationIdParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "GET",
        path: `/MedicationAdministration/${parsed.id}`,
        responseSchema: MedicationAdministrationSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    search(input: MedicationAdministrationSearchParams, signal?: AbortSignal) {
      return transport.request({
        method: "GET",
        path: "/MedicationAdministration",
        query: input,
        querySchema: MedicationAdministrationSearchParamsSchema,
        responseSchema: MedicationAdministrationBundleSchema,
        ...(signal ? { signal } : {}),
      });
    },

    patch(input: {
      id: string;
      body: MedicationAdministrationPatchInput;
      signal?: AbortSignal;
    }) {
      const params = MedicationAdministrationUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PATCH",
        path: `/MedicationAdministration/${params.id}`,
        body: input.body,
        bodySchema: MedicationAdministrationPatchSchema,
        responseSchema: MedicationAdministrationSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    update(input: {
      id: string;
      body: MedicationAdministrationCreateInput;
      signal?: AbortSignal;
    }) {
      const params = MedicationAdministrationUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PUT",
        path: `/MedicationAdministration/${params.id}`,
        body: input.body,
        bodySchema: MedicationAdministrationCreateSchema,
        resourceId: params.id,
        responseSchema: MedicationAdministrationSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },
  };
}

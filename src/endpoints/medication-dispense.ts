import { z } from "zod";

import { type Transport } from "../client/transport";
import {
  MedicationDispenseBundleSchema,
  MedicationDispenseCreateSchema,
  MedicationDispensePatchSchema,
  MedicationDispenseSchema,
  MedicationDispenseSearchParamsSchema,
  MedicationDispenseUpdateParamsSchema,
} from "../schemas/medication-dispense";
import type {
  MedicationDispenseCreateInput,
  MedicationDispensePatchInput,
  MedicationDispenseSearchParams,
} from "../schemas/medication-dispense";

const MedicationDispenseIdParamsSchema = z.object({
  id: z.string().min(1),
});

export function createMedicationDispenseClient(transport: Transport) {
  return {
    create(input: MedicationDispenseCreateInput, signal?: AbortSignal) {
      return transport.request({
        method: "POST",
        path: "/MedicationDispense",
        body: input,
        bodySchema: MedicationDispenseCreateSchema,
        responseSchema: MedicationDispenseSchema,
        ...(signal ? { signal } : {}),
      });
    },

    getById(input: { id: string; signal?: AbortSignal }) {
      const parsed = MedicationDispenseIdParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "GET",
        path: `/MedicationDispense/${parsed.id}`,
        responseSchema: MedicationDispenseSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    search(input: MedicationDispenseSearchParams, signal?: AbortSignal) {
      return transport.request({
        method: "GET",
        path: "/MedicationDispense",
        query: input,
        querySchema: MedicationDispenseSearchParamsSchema,
        responseSchema: MedicationDispenseBundleSchema,
        ...(signal ? { signal } : {}),
      });
    },

    patch(input: {
      id: string;
      body: MedicationDispensePatchInput;
      signal?: AbortSignal;
    }) {
      const params = MedicationDispenseUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PATCH",
        path: `/MedicationDispense/${params.id}`,
        body: input.body,
        bodySchema: MedicationDispensePatchSchema,
        responseSchema: MedicationDispenseSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    update(input: {
      id: string;
      body: MedicationDispenseCreateInput;
      signal?: AbortSignal;
    }) {
      const params = MedicationDispenseUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PUT",
        path: `/MedicationDispense/${params.id}`,
        body: input.body,
        bodySchema: MedicationDispenseCreateSchema,
        resourceId: params.id,
        responseSchema: MedicationDispenseSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },
  };
}

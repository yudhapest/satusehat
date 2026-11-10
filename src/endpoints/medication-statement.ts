import { z } from "zod";

import { type Transport } from "../client/transport";
import {
  MedicationStatementBundleSchema,
  MedicationStatementCreateSchema,
  MedicationStatementPatchSchema,
  MedicationStatementSchema,
  MedicationStatementSearchParamsSchema,
  MedicationStatementUpdateParamsSchema,
} from "../schemas/medication-statement";
import type {
  MedicationStatementCreateInput,
  MedicationStatementPatchInput,
  MedicationStatementSearchParams,
} from "../schemas/medication-statement";

const MedicationStatementIdParamsSchema = z.object({
  id: z.string().min(1),
});

export function createMedicationStatementClient(transport: Transport) {
  return {
    create(input: MedicationStatementCreateInput, signal?: AbortSignal) {
      return transport.request({
        method: "POST",
        path: "/MedicationStatement",
        body: input,
        bodySchema: MedicationStatementCreateSchema,
        responseSchema: MedicationStatementSchema,
        ...(signal ? { signal } : {}),
      });
    },

    getById(input: { id: string; signal?: AbortSignal }) {
      const parsed = MedicationStatementIdParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "GET",
        path: `/MedicationStatement/${parsed.id}`,
        responseSchema: MedicationStatementSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    search(input: MedicationStatementSearchParams, signal?: AbortSignal) {
      return transport.request({
        method: "GET",
        path: "/MedicationStatement",
        query: input,
        querySchema: MedicationStatementSearchParamsSchema,
        responseSchema: MedicationStatementBundleSchema,
        ...(signal ? { signal } : {}),
      });
    },

    patch(input: { id: string; body: MedicationStatementPatchInput; signal?: AbortSignal }) {
      const params = MedicationStatementUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PATCH",
        path: `/MedicationStatement/${params.id}`,
        body: input.body,
        bodySchema: MedicationStatementPatchSchema,
        responseSchema: MedicationStatementSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    update(input: { id: string; body: MedicationStatementCreateInput; signal?: AbortSignal }) {
      const params = MedicationStatementUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PUT",
        path: `/MedicationStatement/${params.id}`,
        body: input.body,
        bodySchema: MedicationStatementCreateSchema,
        resourceId: params.id,
        responseSchema: MedicationStatementSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },
  };
}

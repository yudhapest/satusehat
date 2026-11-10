import { z } from "zod";

import { type Transport } from "../client/transport";
import {
  MedicationCreateSchema,
  MedicationPatchSchema,
  MedicationSchema,
  MedicationUpdateParamsSchema,
} from "../schemas/medication";
import type { MedicationCreateInput, MedicationPatchInput } from "../schemas/medication";

const MedicationIdParamsSchema = z.object({
  id: z.string().min(1),
});

export function createMedicationClient(transport: Transport) {
  return {
    create(input: MedicationCreateInput, signal?: AbortSignal) {
      return transport.request({
        method: "POST",
        path: "/Medication",
        body: input,
        bodySchema: MedicationCreateSchema,
        responseSchema: MedicationSchema,
        ...(signal ? { signal } : {}),
      });
    },

    getById(input: { id: string; signal?: AbortSignal }) {
      const parsed = MedicationIdParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "GET",
        path: `/Medication/${parsed.id}`,
        responseSchema: MedicationSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    patch(input: { id: string; body: MedicationPatchInput; signal?: AbortSignal }) {
      const params = MedicationUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PATCH",
        path: `/Medication/${params.id}`,
        body: input.body,
        bodySchema: MedicationPatchSchema,
        responseSchema: MedicationSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    update(input: { id: string; body: MedicationCreateInput; signal?: AbortSignal }) {
      const params = MedicationUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PUT",
        path: `/Medication/${params.id}`,
        body: input.body,
        bodySchema: MedicationCreateSchema,
        resourceId: params.id,
        responseSchema: MedicationSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },
  };
}

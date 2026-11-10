import { z } from "zod";

import { type Transport } from "../client/transport";
import {
  SpecimenBundleSchema,
  SpecimenCreateSchema,
  SpecimenPatchSchema,
  SpecimenSchema,
  SpecimenSearchParamsSchema,
  SpecimenUpdateParamsSchema,
} from "../schemas/specimen";
import type {
  SpecimenCreateInput,
  SpecimenPatchInput,
  SpecimenSearchParams,
} from "../schemas/specimen";

const SpecimenIdParamsSchema = z.object({
  id: z.string().min(1),
});

export function createSpecimenClient(transport: Transport) {
  return {
    create(input: SpecimenCreateInput, signal?: AbortSignal) {
      return transport.request({
        method: "POST",
        path: "/Specimen",
        body: input,
        bodySchema: SpecimenCreateSchema,
        responseSchema: SpecimenSchema,
        ...(signal ? { signal } : {}),
      });
    },

    getById(input: { id: string; signal?: AbortSignal }) {
      const parsed = SpecimenIdParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "GET",
        path: `/Specimen/${parsed.id}`,
        responseSchema: SpecimenSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    search(input: SpecimenSearchParams, signal?: AbortSignal) {
      return transport.request({
        method: "GET",
        path: "/Specimen",
        query: input,
        querySchema: SpecimenSearchParamsSchema,
        responseSchema: SpecimenBundleSchema,
        ...(signal ? { signal } : {}),
      });
    },

    patch(input: { id: string; body: SpecimenPatchInput; signal?: AbortSignal }) {
      const params = SpecimenUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PATCH",
        path: `/Specimen/${params.id}`,
        body: input.body,
        bodySchema: SpecimenPatchSchema,
        responseSchema: SpecimenSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    update(input: { id: string; body: SpecimenCreateInput; signal?: AbortSignal }) {
      const params = SpecimenUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PUT",
        path: `/Specimen/${params.id}`,
        body: input.body,
        bodySchema: SpecimenCreateSchema,
        resourceId: params.id,
        responseSchema: SpecimenSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },
  };
}

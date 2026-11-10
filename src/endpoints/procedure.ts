import { z } from "zod";

import { type Transport } from "../client/transport";
import {
  ProcedureBundleSchema,
  ProcedureCreateSchema,
  ProcedurePatchSchema,
  ProcedureSchema,
  ProcedureSearchParamsSchema,
  ProcedureUpdateParamsSchema,
} from "../schemas/procedure";
import type {
  ProcedureCreateInput,
  ProcedurePatchInput,
  ProcedureSearchParams,
} from "../schemas/procedure";

const ProcedureIdParamsSchema = z.object({
  id: z.string().min(1),
});

export function createProcedureClient(transport: Transport) {
  return {
    create(input: ProcedureCreateInput, signal?: AbortSignal) {
      return transport.request({
        method: "POST",
        path: "/Procedure",
        body: input,
        bodySchema: ProcedureCreateSchema,
        responseSchema: ProcedureSchema,
        ...(signal ? { signal } : {}),
      });
    },

    getById(input: { id: string; signal?: AbortSignal }) {
      const parsed = ProcedureIdParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "GET",
        path: `/Procedure/${parsed.id}`,
        responseSchema: ProcedureSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    search(input: ProcedureSearchParams, signal?: AbortSignal) {
      return transport.request({
        method: "GET",
        path: "/Procedure",
        query: input,
        querySchema: ProcedureSearchParamsSchema,
        responseSchema: ProcedureBundleSchema,
        ...(signal ? { signal } : {}),
      });
    },

    patch(input: { id: string; body: ProcedurePatchInput; signal?: AbortSignal }) {
      const params = ProcedureUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PATCH",
        path: `/Procedure/${params.id}`,
        body: input.body,
        bodySchema: ProcedurePatchSchema,
        responseSchema: ProcedureSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    update(input: { id: string; body: ProcedureCreateInput; signal?: AbortSignal }) {
      const params = ProcedureUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PUT",
        path: `/Procedure/${params.id}`,
        body: input.body,
        bodySchema: ProcedureCreateSchema,
        resourceId: params.id,
        responseSchema: ProcedureSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },
  };
}

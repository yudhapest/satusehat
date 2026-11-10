import { z } from "zod";

import { type Transport } from "../client/transport";
import {
  DiagnosticReportBundleSchema,
  DiagnosticReportCreateSchema,
  DiagnosticReportPatchSchema,
  DiagnosticReportSchema,
  DiagnosticReportSearchParamsSchema,
  DiagnosticReportUpdateParamsSchema,
} from "../schemas/diagnostic-report";
import type {
  DiagnosticReportCreateInput,
  DiagnosticReportPatchInput,
  DiagnosticReportSearchParams,
} from "../schemas/diagnostic-report";

const DiagnosticReportIdParamsSchema = z.object({
  id: z.string().min(1),
});

export function createDiagnosticReportClient(transport: Transport) {
  return {
    create(input: DiagnosticReportCreateInput, signal?: AbortSignal) {
      return transport.request({
        method: "POST",
        path: "/DiagnosticReport",
        body: input,
        bodySchema: DiagnosticReportCreateSchema,
        responseSchema: DiagnosticReportSchema,
        ...(signal ? { signal } : {}),
      });
    },

    getById(input: { id: string; signal?: AbortSignal }) {
      const parsed = DiagnosticReportIdParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "GET",
        path: `/DiagnosticReport/${parsed.id}`,
        responseSchema: DiagnosticReportSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    search(input: DiagnosticReportSearchParams, signal?: AbortSignal) {
      return transport.request({
        method: "GET",
        path: "/DiagnosticReport",
        query: input,
        querySchema: DiagnosticReportSearchParamsSchema,
        responseSchema: DiagnosticReportBundleSchema,
        ...(signal ? { signal } : {}),
      });
    },

    patch(input: { id: string; body: DiagnosticReportPatchInput; signal?: AbortSignal }) {
      const params = DiagnosticReportUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PATCH",
        path: `/DiagnosticReport/${params.id}`,
        body: input.body,
        bodySchema: DiagnosticReportPatchSchema,
        responseSchema: DiagnosticReportSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    update(input: { id: string; body: DiagnosticReportCreateInput; signal?: AbortSignal }) {
      const params = DiagnosticReportUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PUT",
        path: `/DiagnosticReport/${params.id}`,
        body: input.body,
        bodySchema: DiagnosticReportCreateSchema,
        resourceId: params.id,
        responseSchema: DiagnosticReportSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },
  };
}

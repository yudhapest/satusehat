import { z } from "zod";

import { type Transport } from "../client/transport";
import {
  RiskAssessmentBundleSchema,
  RiskAssessmentCreateSchema,
  RiskAssessmentPatchSchema,
  RiskAssessmentSchema,
  RiskAssessmentSearchParamsSchema,
  RiskAssessmentUpdateParamsSchema,
} from "../schemas/risk-assessment";
import type {
  RiskAssessmentCreateInput,
  RiskAssessmentPatchInput,
  RiskAssessmentSearchParams,
} from "../schemas/risk-assessment";

const RiskAssessmentIdParamsSchema = z.object({
  id: z.string().min(1),
});

export function createRiskAssessmentClient(transport: Transport) {
  return {
    create(input: RiskAssessmentCreateInput, signal?: AbortSignal) {
      return transport.request({
        method: "POST",
        path: "/RiskAssessment",
        body: input,
        bodySchema: RiskAssessmentCreateSchema,
        responseSchema: RiskAssessmentSchema,
        ...(signal ? { signal } : {}),
      });
    },

    getById(input: { id: string; signal?: AbortSignal }) {
      const parsed = RiskAssessmentIdParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "GET",
        path: `/RiskAssessment/${parsed.id}`,
        responseSchema: RiskAssessmentSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    search(input: RiskAssessmentSearchParams, signal?: AbortSignal) {
      return transport.request({
        method: "GET",
        path: "/RiskAssessment",
        query: input,
        querySchema: RiskAssessmentSearchParamsSchema,
        responseSchema: RiskAssessmentBundleSchema,
        ...(signal ? { signal } : {}),
      });
    },

    patch(input: { id: string; body: RiskAssessmentPatchInput; signal?: AbortSignal }) {
      const params = RiskAssessmentUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PATCH",
        path: `/RiskAssessment/${params.id}`,
        body: input.body,
        bodySchema: RiskAssessmentPatchSchema,
        responseSchema: RiskAssessmentSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    update(input: { id: string; body: RiskAssessmentCreateInput; signal?: AbortSignal }) {
      const params = RiskAssessmentUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PUT",
        path: `/RiskAssessment/${params.id}`,
        body: input.body,
        bodySchema: RiskAssessmentCreateSchema,
        resourceId: params.id,
        responseSchema: RiskAssessmentSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },
  };
}

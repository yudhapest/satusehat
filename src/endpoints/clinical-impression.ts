import { z } from "zod";

import { type Transport } from "../client/transport";
import {
  ClinicalImpressionBundleSchema,
  ClinicalImpressionCreateSchema,
  ClinicalImpressionPatchSchema,
  ClinicalImpressionSchema,
  ClinicalImpressionSearchParamsSchema,
  ClinicalImpressionUpdateParamsSchema,
} from "../schemas/clinical-impression";
import type {
  ClinicalImpressionCreateInput,
  ClinicalImpressionPatchInput,
  ClinicalImpressionSearchParams,
} from "../schemas/clinical-impression";

const ClinicalImpressionIdParamsSchema = z.object({
  id: z.string().min(1),
});

export function createClinicalImpressionClient(transport: Transport) {
  return {
    create(input: ClinicalImpressionCreateInput, signal?: AbortSignal) {
      return transport.request({
        method: "POST",
        path: "/ClinicalImpression",
        body: input,
        bodySchema: ClinicalImpressionCreateSchema,
        responseSchema: ClinicalImpressionSchema,
        ...(signal ? { signal } : {}),
      });
    },

    getById(input: { id: string; signal?: AbortSignal }) {
      const parsed = ClinicalImpressionIdParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "GET",
        path: `/ClinicalImpression/${parsed.id}`,
        responseSchema: ClinicalImpressionSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    search(input: ClinicalImpressionSearchParams, signal?: AbortSignal) {
      return transport.request({
        method: "GET",
        path: "/ClinicalImpression",
        query: input,
        querySchema: ClinicalImpressionSearchParamsSchema,
        responseSchema: ClinicalImpressionBundleSchema,
        ...(signal ? { signal } : {}),
      });
    },

    patch(input: { id: string; body: ClinicalImpressionPatchInput; signal?: AbortSignal }) {
      const params = ClinicalImpressionUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PATCH",
        path: `/ClinicalImpression/${params.id}`,
        body: input.body,
        bodySchema: ClinicalImpressionPatchSchema,
        responseSchema: ClinicalImpressionSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    update(input: { id: string; body: ClinicalImpressionCreateInput; signal?: AbortSignal }) {
      const params = ClinicalImpressionUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PUT",
        path: `/ClinicalImpression/${params.id}`,
        body: input.body,
        bodySchema: ClinicalImpressionCreateSchema,
        resourceId: params.id,
        responseSchema: ClinicalImpressionSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },
  };
}

import { z } from "zod";

import { type Transport } from "../client/transport";
import {
  QuestionnaireResponseBundleSchema,
  QuestionnaireResponseCreateSchema,
  QuestionnaireResponsePatchSchema,
  QuestionnaireResponseSchema,
  QuestionnaireResponseSearchParamsSchema,
  QuestionnaireResponseUpdateParamsSchema,
} from "../schemas/questionnaire-response";
import type {
  QuestionnaireResponseCreateInput,
  QuestionnaireResponsePatchInput,
  QuestionnaireResponseSearchParams,
} from "../schemas/questionnaire-response";

const QuestionnaireResponseIdParamsSchema = z.object({
  id: z.string().min(1),
});

export function createQuestionnaireResponseClient(transport: Transport) {
  return {
    create(input: QuestionnaireResponseCreateInput, signal?: AbortSignal) {
      return transport.request({
        method: "POST",
        path: "/QuestionnaireResponse",
        body: input,
        bodySchema: QuestionnaireResponseCreateSchema,
        responseSchema: QuestionnaireResponseSchema,
        ...(signal ? { signal } : {}),
      });
    },

    getById(input: { id: string; signal?: AbortSignal }) {
      const parsed = QuestionnaireResponseIdParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "GET",
        path: `/QuestionnaireResponse/${parsed.id}`,
        responseSchema: QuestionnaireResponseSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    search(input: QuestionnaireResponseSearchParams, signal?: AbortSignal) {
      return transport.request({
        method: "GET",
        path: "/QuestionnaireResponse",
        query: input,
        querySchema: QuestionnaireResponseSearchParamsSchema,
        responseSchema: QuestionnaireResponseBundleSchema,
        ...(signal ? { signal } : {}),
      });
    },

    patch(input: { id: string; body: QuestionnaireResponsePatchInput; signal?: AbortSignal }) {
      const params = QuestionnaireResponseUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PATCH",
        path: `/QuestionnaireResponse/${params.id}`,
        body: input.body,
        bodySchema: QuestionnaireResponsePatchSchema,
        responseSchema: QuestionnaireResponseSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    update(input: { id: string; body: QuestionnaireResponseCreateInput; signal?: AbortSignal }) {
      const params = QuestionnaireResponseUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PUT",
        path: `/QuestionnaireResponse/${params.id}`,
        body: input.body,
        bodySchema: QuestionnaireResponseCreateSchema,
        resourceId: params.id,
        responseSchema: QuestionnaireResponseSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },
  };
}

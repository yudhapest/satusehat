import { z } from "zod";

import { type Transport } from "../client/transport";
import {
  FamilyMemberHistoryBundleSchema,
  FamilyMemberHistoryCreateSchema,
  FamilyMemberHistoryPatchSchema,
  FamilyMemberHistorySchema,
  FamilyMemberHistorySearchParamsSchema,
  FamilyMemberHistoryUpdateParamsSchema,
} from "../schemas/family-member-history";
import type {
  FamilyMemberHistoryCreateInput,
  FamilyMemberHistoryPatchInput,
  FamilyMemberHistorySearchParams,
} from "../schemas/family-member-history";

const FamilyMemberHistoryIdParamsSchema = z.object({
  id: z.string().min(1),
});

export function createFamilyMemberHistoryClient(transport: Transport) {
  return {
    create(input: FamilyMemberHistoryCreateInput, signal?: AbortSignal) {
      return transport.request({
        method: "POST",
        path: "/FamilyMemberHistory",
        body: input,
        bodySchema: FamilyMemberHistoryCreateSchema,
        responseSchema: FamilyMemberHistorySchema,
        ...(signal ? { signal } : {}),
      });
    },

    getById(input: { id: string; signal?: AbortSignal }) {
      const parsed = FamilyMemberHistoryIdParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "GET",
        path: `/FamilyMemberHistory/${parsed.id}`,
        responseSchema: FamilyMemberHistorySchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    search(input: FamilyMemberHistorySearchParams, signal?: AbortSignal) {
      return transport.request({
        method: "GET",
        path: "/FamilyMemberHistory",
        query: input,
        querySchema: FamilyMemberHistorySearchParamsSchema,
        responseSchema: FamilyMemberHistoryBundleSchema,
        ...(signal ? { signal } : {}),
      });
    },

    patch(input: { id: string; body: FamilyMemberHistoryPatchInput; signal?: AbortSignal }) {
      const params = FamilyMemberHistoryUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PATCH",
        path: `/FamilyMemberHistory/${params.id}`,
        body: input.body,
        bodySchema: FamilyMemberHistoryPatchSchema,
        responseSchema: FamilyMemberHistorySchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    update(input: { id: string; body: FamilyMemberHistoryCreateInput; signal?: AbortSignal }) {
      const params = FamilyMemberHistoryUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PUT",
        path: `/FamilyMemberHistory/${params.id}`,
        body: input.body,
        bodySchema: FamilyMemberHistoryCreateSchema,
        resourceId: params.id,
        responseSchema: FamilyMemberHistorySchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },
  };
}

import { z } from "zod";

import { type Transport } from "../client/transport";
import {
  OrganizationBundleSchema,
  OrganizationCreateSchema,
  OrganizationSchema,
  OrganizationSearchParamsSchema,
  OrganizationUpdateParamsSchema,
} from "../schemas/organization";
import type { OrganizationCreateInput, OrganizationSearchParams } from "../schemas/organization";

const OrganizationIdParamsSchema = z.object({
  id: z.string().min(1),
});

export function createOrganizationClient(transport: Transport) {
  return {
    create(input: OrganizationCreateInput, signal?: AbortSignal) {
      return transport.request({
        method: "POST",
        path: "/Organization",
        body: input,
        bodySchema: OrganizationCreateSchema,
        responseSchema: OrganizationSchema,
        ...(signal ? { signal } : {}),
      });
    },

    getById(input: { id: string; signal?: AbortSignal }) {
      const parsed = OrganizationIdParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "GET",
        path: `/Organization/${parsed.id}`,
        responseSchema: OrganizationSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    search(input: OrganizationSearchParams, signal?: AbortSignal) {
      return transport.request({
        method: "GET",
        path: "/Organization",
        query: input,
        querySchema: OrganizationSearchParamsSchema,
        responseSchema: OrganizationBundleSchema,
        ...(signal ? { signal } : {}),
      });
    },

    update(input: { id: string; body: OrganizationCreateInput; signal?: AbortSignal }) {
      const params = OrganizationUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PUT",
        path: `/Organization/${params.id}`,
        body: input.body,
        bodySchema: OrganizationCreateSchema,
        resourceId: params.id,
        responseSchema: OrganizationSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },
  };
}

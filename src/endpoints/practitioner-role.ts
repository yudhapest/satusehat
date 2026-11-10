import { z } from "zod";

import { type Transport } from "../client/transport";
import {
  PractitionerRoleBundleSchema,
  PractitionerRoleCreateSchema,
  PractitionerRolePatchSchema,
  PractitionerRoleSchema,
  PractitionerRoleSearchParamsSchema,
  PractitionerRoleUpdateParamsSchema,
} from "../schemas/practitioner-role";
import type {
  PractitionerRoleCreateInput,
  PractitionerRolePatchInput,
  PractitionerRoleSearchParams,
} from "../schemas/practitioner-role";

const PractitionerRoleIdParamsSchema = z.object({
  id: z.string().min(1),
});

export function createPractitionerRoleClient(transport: Transport) {
  return {
    create(input: PractitionerRoleCreateInput, signal?: AbortSignal) {
      return transport.request({
        method: "POST",
        path: "/PractitionerRole",
        body: input,
        bodySchema: PractitionerRoleCreateSchema,
        responseSchema: PractitionerRoleSchema,
        ...(signal ? { signal } : {}),
      });
    },

    getById(input: { id: string; signal?: AbortSignal }) {
      const parsed = PractitionerRoleIdParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "GET",
        path: `/PractitionerRole/${parsed.id}`,
        responseSchema: PractitionerRoleSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    search(input: PractitionerRoleSearchParams, signal?: AbortSignal) {
      return transport.request({
        method: "GET",
        path: "/PractitionerRole",
        query: input,
        querySchema: PractitionerRoleSearchParamsSchema,
        responseSchema: PractitionerRoleBundleSchema,
        ...(signal ? { signal } : {}),
      });
    },

    patch(input: { id: string; body: PractitionerRolePatchInput; signal?: AbortSignal }) {
      const params = PractitionerRoleUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PATCH",
        path: `/PractitionerRole/${params.id}`,
        body: input.body,
        bodySchema: PractitionerRolePatchSchema,
        responseSchema: PractitionerRoleSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    update(input: { id: string; body: PractitionerRoleCreateInput; signal?: AbortSignal }) {
      const params = PractitionerRoleUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PUT",
        path: `/PractitionerRole/${params.id}`,
        body: input.body,
        bodySchema: PractitionerRoleCreateSchema,
        resourceId: params.id,
        responseSchema: PractitionerRoleSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },
  };
}

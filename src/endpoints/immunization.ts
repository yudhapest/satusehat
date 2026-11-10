import { z } from "zod";

import { type Transport } from "../client/transport";
import {
  ImmunizationBundleSchema,
  ImmunizationCreateSchema,
  ImmunizationPatchSchema,
  ImmunizationSchema,
  ImmunizationSearchParamsSchema,
  ImmunizationUpdateParamsSchema,
} from "../schemas/immunization";
import type {
  ImmunizationCreateInput,
  ImmunizationPatchInput,
  ImmunizationSearchParams,
} from "../schemas/immunization";

const ImmunizationIdParamsSchema = z.object({
  id: z.string().min(1),
});

export function createImmunizationClient(transport: Transport) {
  return {
    create(input: ImmunizationCreateInput, signal?: AbortSignal) {
      return transport.request({
        method: "POST",
        path: "/Immunization",
        body: input,
        bodySchema: ImmunizationCreateSchema,
        responseSchema: ImmunizationSchema,
        ...(signal ? { signal } : {}),
      });
    },

    getById(input: { id: string; signal?: AbortSignal }) {
      const parsed = ImmunizationIdParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "GET",
        path: `/Immunization/${parsed.id}`,
        responseSchema: ImmunizationSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    search(input: ImmunizationSearchParams, signal?: AbortSignal) {
      return transport.request({
        method: "GET",
        path: "/Immunization",
        query: input,
        querySchema: ImmunizationSearchParamsSchema,
        responseSchema: ImmunizationBundleSchema,
        ...(signal ? { signal } : {}),
      });
    },

    patch(input: {
      id: string;
      body: ImmunizationPatchInput;
      signal?: AbortSignal;
    }) {
      const params = ImmunizationUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PATCH",
        path: `/Immunization/${params.id}`,
        body: input.body,
        bodySchema: ImmunizationPatchSchema,
        responseSchema: ImmunizationSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    update(input: {
      id: string;
      body: ImmunizationCreateInput;
      signal?: AbortSignal;
    }) {
      const params = ImmunizationUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PUT",
        path: `/Immunization/${params.id}`,
        body: input.body,
        bodySchema: ImmunizationCreateSchema,
        resourceId: params.id,
        responseSchema: ImmunizationSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },
  };
}

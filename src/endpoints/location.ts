import { z } from "zod";

import { type Transport } from "../client/transport";
import {
  LocationBundleSchema,
  LocationCreateSchema,
  LocationPatchSchema,
  LocationSchema,
  LocationSearchParamsSchema,
  LocationUpdateParamsSchema,
} from "../schemas/location";
import type { LocationCreateInput, LocationPatchInput, LocationSearchParams } from "../schemas/location";

const LocationIdParamsSchema = z.object({
  id: z.string().min(1),
});

export function createLocationClient(transport: Transport) {
  return {
    create(input: LocationCreateInput, signal?: AbortSignal) {
      return transport.request({
        method: "POST",
        path: "/Location",
        body: input,
        bodySchema: LocationCreateSchema,
        responseSchema: LocationSchema,
        ...(signal ? { signal } : {}),
      });
    },

    getById(input: { id: string; signal?: AbortSignal }) {
      const parsed = LocationIdParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "GET",
        path: `/Location/${parsed.id}`,
        responseSchema: LocationSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    search(input: LocationSearchParams, signal?: AbortSignal) {
      return transport.request({
        method: "GET",
        path: "/Location",
        query: input,
        querySchema: LocationSearchParamsSchema,
        responseSchema: LocationBundleSchema,
        ...(signal ? { signal } : {}),
      });
    },

    patch(input: { id: string; body: LocationPatchInput; signal?: AbortSignal }) {
      const params = LocationUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PATCH",
        path: `/Location/${params.id}`,
        body: input.body,
        bodySchema: LocationPatchSchema,
        responseSchema: LocationSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    update(input: { id: string; body: LocationCreateInput; signal?: AbortSignal }) {
      const params = LocationUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PUT",
        path: `/Location/${params.id}`,
        body: input.body,
        bodySchema: LocationCreateSchema,
        resourceId: params.id,
        responseSchema: LocationSchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },
  };
}

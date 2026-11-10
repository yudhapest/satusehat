import { z } from "zod";

import { type Transport } from "../client/transport";
import {
  ImagingStudyBundleSchema,
  ImagingStudyCreateSchema,
  ImagingStudyPatchSchema,
  ImagingStudySchema,
  ImagingStudySearchParamsSchema,
  ImagingStudyUpdateParamsSchema,
} from "../schemas/imaging-study";
import type {
  ImagingStudyCreateInput,
  ImagingStudyPatchInput,
  ImagingStudySearchParams,
} from "../schemas/imaging-study";

const ImagingStudyIdParamsSchema = z.object({
  id: z.string().min(1),
});

export function createImagingStudyClient(transport: Transport) {
  return {
    create(input: ImagingStudyCreateInput, signal?: AbortSignal) {
      return transport.request({
        method: "POST",
        path: "/ImagingStudy",
        body: input,
        bodySchema: ImagingStudyCreateSchema,
        responseSchema: ImagingStudySchema,
        ...(signal ? { signal } : {}),
      });
    },

    getById(input: { id: string; signal?: AbortSignal }) {
      const parsed = ImagingStudyIdParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "GET",
        path: `/ImagingStudy/${parsed.id}`,
        responseSchema: ImagingStudySchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    search(input: ImagingStudySearchParams, signal?: AbortSignal) {
      return transport.request({
        method: "GET",
        path: "/ImagingStudy",
        query: input,
        querySchema: ImagingStudySearchParamsSchema,
        responseSchema: ImagingStudyBundleSchema,
        ...(signal ? { signal } : {}),
      });
    },

    patch(input: { id: string; body: ImagingStudyPatchInput; signal?: AbortSignal }) {
      const params = ImagingStudyUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PATCH",
        path: `/ImagingStudy/${params.id}`,
        body: input.body,
        bodySchema: ImagingStudyPatchSchema,
        responseSchema: ImagingStudySchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },

    update(input: { id: string; body: ImagingStudyCreateInput; signal?: AbortSignal }) {
      const params = ImagingStudyUpdateParamsSchema.parse({ id: input.id });

      return transport.request({
        method: "PUT",
        path: `/ImagingStudy/${params.id}`,
        body: input.body,
        bodySchema: ImagingStudyCreateSchema,
        resourceId: params.id,
        responseSchema: ImagingStudySchema,
        ...(input.signal ? { signal: input.signal } : {}),
      });
    },
  };
}

import { type ZodTypeAny } from "zod";

import { resolveAccessToken } from "./auth";
import { SatuSehatApiError, SatuSehatValidationError } from "../core/errors";
import {
  type AccessTokenProvider,
  type FetchLike,
  type HeadersInit,
  type QueryParams,
} from "../core/types";

export interface TransportOptions {
  baseUrl: string;
  accessToken?: AccessTokenProvider;
  invalidateAccessToken?: () => Promise<void>;
  retryOnUnauthorized?: boolean;
  defaultHeaders?: HeadersInit;
  fetch?: FetchLike;
  validateResponse?: boolean;
}

export interface RequestOptions<
  TQuerySchema extends ZodTypeAny | undefined,
  TBodySchema extends ZodTypeAny | undefined,
  TResponseSchema extends ZodTypeAny,
> {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  query?: unknown;
  querySchema?: TQuerySchema;
  body?: unknown;
  bodySchema?: TBodySchema;
  /**
   * Resource id for PUT requests. SATUSEHAT requires the id inside the body; it is set after
   * validation so body schemas that do not declare `id` do not strip it.
   */
  resourceId?: string;
  headers?: HeadersInit;
  signal?: AbortSignal;
  responseSchema: TResponseSchema;
}

export interface TextRequestOptions<TQuerySchema extends ZodTypeAny | undefined> {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  query?: unknown;
  querySchema?: TQuerySchema;
  headers?: HeadersInit;
  signal?: AbortSignal;
}

export interface Transport {
  request<
    TQuerySchema extends ZodTypeAny | undefined,
    TBodySchema extends ZodTypeAny | undefined,
    TResponseSchema extends ZodTypeAny,
  >(
    options: RequestOptions<TQuerySchema, TBodySchema, TResponseSchema>,
  ): Promise<InferSchema<TResponseSchema>>;
  requestText<TQuerySchema extends ZodTypeAny | undefined>(
    options: TextRequestOptions<TQuerySchema>,
  ): Promise<string>;
}

type InferSchema<TSchema extends ZodTypeAny> = TSchema["_output"];

export function createTransport(options: TransportOptions): Transport {
  const httpClient = options.fetch ?? fetch;
  const baseUrl = options.baseUrl.replace(/\/$/, "");
  const validateResponse = options.validateResponse ?? true;
  const retryOnUnauthorized = options.retryOnUnauthorized ?? true;

  return {
    async request<
      TQuerySchema extends ZodTypeAny | undefined,
      TBodySchema extends ZodTypeAny | undefined,
      TResponseSchema extends ZodTypeAny,
    >(
      requestOptions: RequestOptions<TQuerySchema, TBodySchema, TResponseSchema>,
    ): Promise<InferSchema<TResponseSchema>> {
      const query = validateQuery(requestOptions.querySchema, requestOptions.query);
      const validatedBody = validateBody(requestOptions.bodySchema, requestOptions.body);
      const body =
        requestOptions.resourceId !== undefined &&
        typeof validatedBody === "object" &&
        validatedBody !== null
          ? { ...validatedBody, id: requestOptions.resourceId }
          : validatedBody;
      const url = new URL(`${baseUrl}${requestOptions.path}`);

      appendQuery(url, query);

      const execute = async (): Promise<Response> => {
        const token = await resolveAccessToken(options.accessToken);

        return httpClient(url, {
          method: requestOptions.method,
          headers: {
            accept: "application/json",
            ...(body !== undefined ? { "content-type": "application/json" } : {}),
            ...(token ? { authorization: `Bearer ${token}` } : {}),
            ...options.defaultHeaders,
            ...requestOptions.headers,
          },
          ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
          ...(requestOptions.signal ? { signal: requestOptions.signal } : {}),
        });
      };

      let response = await execute();
      let payload = await readResponsePayload(response);

      if (
        response.status === 401 &&
        retryOnUnauthorized &&
        options.invalidateAccessToken
      ) {
        await options.invalidateAccessToken();
        response = await execute();
        payload = await readResponsePayload(response);
      }

      if (!response.ok) {
        throw new SatuSehatApiError(
          `SATUSEHAT request failed with status ${response.status}`,
          response.status,
          payload,
        );
      }

      if (!validateResponse) {
        return payload as InferSchema<TResponseSchema>;
      }

      const parsed = requestOptions.responseSchema.safeParse(payload);

      if (!parsed.success) {
        throw new SatuSehatValidationError(
          "SATUSEHAT response validation failed",
          parsed.error.issues,
        );
      }

      return parsed.data;
    },

    async requestText<TQuerySchema extends ZodTypeAny | undefined>(
      requestOptions: TextRequestOptions<TQuerySchema>,
    ): Promise<string> {
      const query = validateQuery(requestOptions.querySchema, requestOptions.query);
      const url = new URL(`${baseUrl}${requestOptions.path}`);

      appendQuery(url, query);

      const execute = async (): Promise<Response> => {
        const token = await resolveAccessToken(options.accessToken);

        return httpClient(url, {
          method: requestOptions.method,
          headers: {
            ...(token ? { authorization: `Bearer ${token}` } : {}),
            ...options.defaultHeaders,
            ...requestOptions.headers,
          },
          ...(requestOptions.signal ? { signal: requestOptions.signal } : {}),
        });
      };

      let response = await execute();

      if (
        response.status === 401 &&
        retryOnUnauthorized &&
        options.invalidateAccessToken
      ) {
        await options.invalidateAccessToken();
        response = await execute();
      }

      if (!response.ok) {
        const payload = await readResponsePayload(response);

        throw new SatuSehatApiError(
          `SATUSEHAT request failed with status ${response.status}`,
          response.status,
          payload,
        );
      }

      return response.text();
    },
  };
}

function validateQuery<TQuerySchema extends ZodTypeAny | undefined>(
  schema: TQuerySchema,
  input: unknown,
): QueryParams | undefined {
  if (!schema || input == null) {
    return input as QueryParams | undefined;
  }

  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    throw new SatuSehatValidationError(
      "SATUSEHAT request query validation failed",
      parsed.error.issues,
    );
  }

  return parsed.data as QueryParams;
}

function validateBody<TBodySchema extends ZodTypeAny | undefined>(
  schema: TBodySchema,
  input: unknown,
): unknown {
  if (!schema || input == null) {
    return input;
  }

  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    throw new SatuSehatValidationError(
      "SATUSEHAT request body validation failed",
      parsed.error.issues,
    );
  }

  return parsed.data;
}

function appendQuery(url: URL, query?: QueryParams): void {
  if (!query) {
    return;
  }

  for (const [key, rawValue] of Object.entries(query)) {
    if (rawValue == null) {
      continue;
    }

    if (Array.isArray(rawValue)) {
      for (const item of rawValue) {
        url.searchParams.append(key, stringifyQueryValue(item));
      }

      continue;
    }

    url.searchParams.set(key, stringifyQueryValue(rawValue));
  }
}

function stringifyQueryValue(value: string | number | boolean | Date): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

async function readResponsePayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const text = await response.text();
    if (!text) {
      return undefined;
    }

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  return response.text();
}

import { z } from "zod";

import { createMemoryTokenStore, isAccessTokenExpired } from "./token-store";
import { SatuSehatApiError, SatuSehatConfigError, SatuSehatValidationError } from "../core/errors";
import {
  type FetchLike,
  type HeadersInit,
  type MaybePromise,
  type OAuthClientCredentials,
  type StoredAccessToken,
  type TokenStore,
} from "../core/types";

const AccessTokenSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.coerce.number().positive(),
  issued_at: z.coerce.number().positive().optional(),
  token_type: z.string().min(1),
});

export interface ClientCredentialsTokenProviderOptions extends OAuthClientCredentials {
  authBaseUrl: string;
  fetch?: FetchLike;
  headers?: HeadersInit;
  tokenStore?: TokenStore;
  tokenExpiryWindowMs?: number;
  now?: () => number;
}

export function createClientCredentialsTokenProvider(
  options: ClientCredentialsTokenProviderOptions,
): () => Promise<string> {
  const httpClient = options.fetch ?? fetch;
  const tokenStore = options.tokenStore ?? createMemoryTokenStore();

  return async () => {
    const now = options.now?.() ?? Date.now();
    const cachedToken = await tokenStore.getToken();

    if (
      cachedToken &&
      !isAccessTokenExpired(cachedToken, {
        now,
        ...(options.tokenExpiryWindowMs !== undefined
          ? { safetyWindowMs: options.tokenExpiryWindowMs }
          : {}),
      })
    ) {
      return cachedToken.accessToken;
    }

    const authBaseUrl = options.authBaseUrl.replace(/\/$/, "");
    const body = new URLSearchParams({
      client_id: options.clientId,
      client_secret: options.clientSecret,
    });

    const response = await httpClient(`${authBaseUrl}/accesstoken?grant_type=client_credentials`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        ...options.headers,
      },
      body,
    });

    const raw = await safeParseJson(response);

    if (!response.ok) {
      throw new SatuSehatApiError(
        `SATUSEHAT auth request failed with status ${response.status}`,
        response.status,
        raw,
      );
    }

    const parsed = AccessTokenSchema.safeParse(raw);

    if (!parsed.success) {
      throw new SatuSehatValidationError(
        "SATUSEHAT auth response validation failed",
        parsed.error.issues,
      );
    }

    const issuedAt = parsed.data.issued_at ?? now;
    const token = toStoredAccessToken(parsed.data.access_token, parsed.data.token_type, parsed.data.expires_in, issuedAt);

    await tokenStore.setToken(token);

    return token.accessToken;
  };
}

export async function resolveAccessToken(
  accessToken?: string | (() => MaybePromise<string>),
): Promise<string | undefined> {
  if (!accessToken) {
    return undefined;
  }

  if (typeof accessToken === "string") {
    return accessToken;
  }

  const token = await accessToken();

  if (!token) {
    throw new SatuSehatConfigError("SATUSEHAT access token provider returned an empty token");
  }

  return token;
}

async function safeParseJson(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text);
  } catch (cause) {
    throw new SatuSehatConfigError("Unable to parse SATUSEHAT auth response as JSON", { cause });
  }
}

function toStoredAccessToken(
  accessToken: string,
  tokenType: string,
  expiresIn: number,
  issuedAt: number,
): StoredAccessToken {
  return {
    accessToken,
    tokenType,
    expiresIn,
    issuedAt,
    expiresAt: issuedAt + expiresIn * 1_000,
  };
}

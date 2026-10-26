/**
 * Stackra file contract:
 * Purpose: `requestToken`, one call to an OAuth token endpoint (a code exchange, a client credentials grant, a refresh,
 *          a JWT bearer assertion), answered as `OAuthTokens`.
 * Boundary: public from `.`, so a store host (the integrations service's code exchange and refresh) uses the same RFC
 *           6749 client as the managed client; the endpoint and the client are data (`TokenRequest`). A 4xx answer is
 *           a `ProviderRefusedError` carrying the OAuth error code (`invalid_grant`); no answer, a 408, a 429, a 5xx or
 *           an answer without an access token is a retryable `ProviderUnavailableError`. The answer body, which holds
 *           the tokens, is never put in an error.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 6, 7 and 20); RFC 6749 (sections 2.3.1, 4.1.3, 4.4, 5 and 6).
 */
import { ProviderRefusedError } from "#core/errors/provider-refused.error";
import { ProviderUnavailableError } from "#core/errors/provider-unavailable.error";
import { providerCodeOf } from "#core/functions/provider-code-of.function";
import { tokenEndpointInit } from "#core/functions/token-endpoint-init.function";
import type { OAuthTokens } from "#core/types/oauth-tokens.type";
import type { TokenRequest } from "#core/types/token-request.type";

/** The JSON object of `text`, or undefined. */
function jsonOf(text: string): Readonly<Record<string, unknown>> | undefined {
  try {
    const value = JSON.parse(text) as unknown;
    return typeof value === "object" && value !== null
      ? (value as Readonly<Record<string, unknown>>)
      : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The tokens the endpoint grants.
 *
 * @throws ProviderRefusedError when the endpoint refuses the grant (a 4xx other than 408 and 429).
 * @throws ProviderUnavailableError when it does not answer, answers 408, 429 or 5xx, or answers without a token.
 * @example
 * const tokens = await requestToken({ url, form: { grant_type: "client_credentials" }, ...client, provider, now });
 * const renewed = await requestToken({ url, form: { grant_type: "refresh_token", refresh_token }, ...client, provider, now });
 */
export async function requestToken(request: TokenRequest): Promise<OAuthTokens> {
  const { provider } = request;
  let response: Response;
  try {
    response = await fetch(
      request.url,
      tokenEndpointInit(
        request.form,
        request.clientId,
        request.clientSecret,
        request.authentication ?? "basic",
      ),
    );
  } catch (error) {
    throw ProviderUnavailableError.create({ provider }, { cause: error });
  }
  const answer = jsonOf(await response.text());
  const { status } = response;
  if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
    const code = providerCodeOf(answer);
    throw ProviderRefusedError.create({
      provider,
      status,
      ...(code === undefined ? {} : { code }),
    });
  }
  const accessToken = answer?.["access_token"];
  if (!response.ok || typeof accessToken !== "string" || accessToken === "")
    throw ProviderUnavailableError.create({ provider, status });
  const refreshToken = answer?.["refresh_token"];
  const expiresIn = answer?.["expires_in"];
  return {
    accessToken,
    ...(typeof refreshToken === "string" && refreshToken !== "" ? { refreshToken } : {}),
    ...(typeof expiresIn === "number" && expiresIn > 0
      ? { expiresAt: new Date(request.now.getTime() + expiresIn * 1000) }
      : {}),
  };
}

/**
 * Stackra file contract:
 * Purpose: `jwksSource`: gitHub's key set, cached in KV for `seconds` and refetched once when a `kid` is unknown.
 * Boundary: verification only; minting the publish token is `exchangeToken`'s. Throws `OidcError` with a reason that
 *           names no token value.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 3 and 6).
 */
import type { KeySource } from "#src/interfaces/key-source.type";
import type { KvNamespace } from "#src/interfaces/kv-namespace.interface";
import { OidcError } from "#src/oidc/oidc-error";

/** The KV key of the cached key set. */
const JWKS_KEY = "oidc:github:jwks";

/** The key of `kid` in a key set body, or null. */
const find = (body: string | null, kid: string): JsonWebKey | null => {
  if (body === null) return null;
  const { keys } = JSON.parse(body) as { keys: (JsonWebKey & { kid?: string })[] };
  return keys.find((key) => key.kid === kid) ?? null;
};

/**
 * GitHub's key set, cached in KV for `seconds` and refetched once when a `kid` is unknown.
 *
 * @example
 * const keys = jwksSource(env.CACHE, fetch, "https://token.actions.githubusercontent.com", 3600);
 */
export function jwksSource(
  cache: KvNamespace,
  fetcher: typeof fetch,
  issuer: string,
  seconds: number,
): KeySource {
  return async (kid) => {
    const cached = find(await cache.get(JWKS_KEY), kid);
    if (cached !== null) return cached;
    const response = await fetcher(`${issuer}/.well-known/jwks`);
    if (!response.ok) throw new OidcError(`GitHub key set answered ${response.status}`);
    const body = await response.text();
    await cache.put(JWKS_KEY, body, { expirationTtl: seconds });
    return find(body, kid);
  };
}

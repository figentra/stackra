/**
 * Stackra file contract:
 * Purpose: `jwksKeySource`, an issuer's public keys by `kid`: the `jwks_uri` from the issuer's OIDC discovery document,
 *          the key set from there, held in memory for `seconds` and refetched once when a `kid` is unknown.
 * Boundary: fetch only, so the `oidc` `JsonWebKeys` driver and the edge Worker share it. The discovery document's
 *           `issuer` must equal the configured one (OpenID Connect Discovery 4.3). An unknown `kid` refetches at most
 *           once per `REFETCH_SECONDS`, so a stream of made-up `kid`s cannot hammer the issuer. A non-2xx answer or a
 *           malformed document throws an `Error` that names the issuer and status, never a token.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 8: tokens verified by JWKS); OpenID Connect Discovery 1.0; RFC 7517.
 */
import type { JsonWebKeys } from "#contracts/ports/json-web-keys.port";

/** The least time between two fetches an unknown `kid` may cause, in seconds. */
const REFETCH_SECONDS = 30;

/** One key of a key set. */
type KeyOfSet = JsonWebKey & { readonly kid?: string };

/**
 * The keys of `issuer`, cached for `seconds`.
 *
 * @param issuer - the issuer URL, exactly as tokens carry it in `iss`.
 * @param seconds - how long a fetched key set is trusted before it is fetched again.
 * @param fetcher - the fetch to use; the global one by default.
 * @example
 * const keys = jwksKeySource("https://auth.figentra.com", 3600);
 * const jwk = await keys("kid-1");
 */
export function jwksKeySource(
  issuer: string,
  seconds: number,
  fetcher: typeof fetch = fetch,
): JsonWebKeys["find"] {
  let keys: readonly KeyOfSet[] = [];
  let fetchedAt = Number.NEGATIVE_INFINITY;

  const json = async (url: string): Promise<Record<string, unknown>> => {
    const response = await fetcher(url, { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`${url} answered ${response.status}`);
    const body: unknown = await response.json();
    if (typeof body !== "object" || body === null)
      throw new Error(`${url} answered no JSON object`);
    return body as Record<string, unknown>;
  };

  const refresh = async (): Promise<void> => {
    const discovery = await json(`${issuer.replace(/\/$/, "")}/.well-known/openid-configuration`);
    if (discovery["issuer"] !== issuer || typeof discovery["jwks_uri"] !== "string")
      throw new Error(`${issuer} discovery names another issuer or no jwks_uri`);
    const set = await json(discovery["jwks_uri"]);
    if (!Array.isArray(set["keys"])) throw new Error(`${issuer} key set has no keys`);
    keys = set["keys"] as KeyOfSet[];
    fetchedAt = Date.now();
  };

  const find = (kid: string): JsonWebKey | null => keys.find((key) => key.kid === kid) ?? null;

  return async (kid) => {
    const age = (Date.now() - fetchedAt) / 1000;
    if (age >= seconds) await refresh();
    const known = find(kid);
    if (known !== null || (Date.now() - fetchedAt) / 1000 < REFETCH_SECONDS) return known;
    await refresh();
    return find(kid);
  };
}

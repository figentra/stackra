/**
 * Stackra file contract:
 * Purpose: `cachedLicenceCheck`: the licence check behind the edge cache.
 * Boundary: caching only; the cache key is the token's SHA-256, never the token.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 3 and 13).
 */
import type { LicenceCheck } from "#src/access/licence-check.port";
import { sha256Hex } from "#src/bytes/sha256-hex";
import type { EdgeCache } from "#src/interfaces/edge-cache.interface";
import type { LicenceView } from "#src/interfaces/licence-view.interface";

/** A synthetic origin: cache keys must be URLs, and this one is never fetched. */
const CACHE_ORIGIN = "https://licence-check.stackra-registry.internal";

/**
 * The licence check behind the edge cache.
 *
 * @example
 * const licences = cachedLicenceCheck(new D1LicenceCheck(env.DB), caches.default, settings.tokenCacheSeconds);
 */
export function cachedLicenceCheck(
  inner: LicenceCheck,
  cache: EdgeCache,
  seconds: number,
): LicenceCheck {
  return {
    async check(token) {
      const key = new Request(`${CACHE_ORIGIN}/${await sha256Hex(token)}`);
      const hit = await cache.match(key);
      if (hit !== undefined) return (await hit.json()) as LicenceView;
      const licence = await inner.check(token);
      if (licence !== null)
        await cache.put(
          key,
          new Response(JSON.stringify(licence), {
            headers: { "content-type": "application/json", "cache-control": `max-age=${seconds}` },
          }),
        );
      return licence;
    },
  };
}

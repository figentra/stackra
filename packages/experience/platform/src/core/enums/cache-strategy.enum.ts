/**
 * Stackra file contract:
 * Purpose: `CacheStrategy`, the strategy of one route in the PWA service worker (`PwaConfig.caching.routes`), each
 *          compiled by gen to the Workbox strategy of the same name.
 * Boundary: an `Enum.of` value plus the type of the same name; data only.
 * Runtime: isomorphic
 * Governing contract: ADR 0255 (decision 2); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** How one route is answered. */
export const CacheStrategy = Enum.of({
  /** The cache, then the network: hashed or versioned files. */
  CacheFirst: "cache_first",
  /** The network, then the cache. */
  NetworkFirst: "network_first",
  /** The cache now, refreshed from the network for next time. */
  StaleWhileRevalidate: "stale_while_revalidate",
  /** Always the network, never cached. */
  NetworkOnly: "network_only",
  /** Only the cache. */
  CacheOnly: "cache_only",
});

/** One of the codes above. */
export type CacheStrategy = Enum.Value<typeof CacheStrategy>;

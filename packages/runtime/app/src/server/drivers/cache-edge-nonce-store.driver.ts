/**
 * Stackra file contract:
 * Purpose: `CacheEdgeNonceStoreDriver` (`cache`), the `EdgeNonceStore` driver shared by every API instance of a region:
 *          a request id is claimed with `Cache.add`, the cache's atomic set-if-absent, so a signed request replayed
 *          against another instance inside the window is refused there too.
 * Boundary: needs a `Cache` driver whose store is shared and atomic (`valkey`, `postgres`); `memory` is atomic only in
 *           one process, and `storage` and `workers` reject `add`, so a claim fails closed. The key is
 *           `EdgeNonceStore:<request id>` in the namespace current when the guard runs (the shared one: no call has
 *           started). A claim lives exactly `ttlSeconds`; the value stored is `true`, never request data.
 * Runtime: node
 * Governing contract: ADR 0437 (decision 4 and Enforcement: a shared nonce store, `Cache.add`); ADR 0150; ADR 0263.
 */
import { CacheKey } from "@stackra/cache";
import type { Cache } from "@stackra/cache/contracts";
import { Driver } from "@stackra/container";
import { Duration } from "@stackra/contracts";

import { EdgeNonceStore } from "#contracts/ports/edge-nonce-store.port";

/**
 * Seen edge request ids in the shared cache.
 *
 * @example
 * // runway: config.app.edge.nonces: cache, with config.cache.driver: valkey
 * await nonces.claim("req-1", 120); // true on the first instance
 * await nonces.claim("req-1", 120); // false on every instance
 */
export class CacheEdgeNonceStoreDriver extends Driver(EdgeNonceStore) {
  /** The shared cache the claims go to. */
  private readonly cache: Cache;

  /**
   * @param cache - the bound cache; config `cache.driver` picks a shared one.
   */
  constructor(cache: Cache) {
    super();
    this.cache = cache;
  }

  /** Records `nonce` for `ttlSeconds` across every instance; false while an earlier claim of it is live anywhere. */
  claim(nonce: string, ttlSeconds: number): Promise<boolean> {
    return this.cache.add(CacheKey.of(EdgeNonceStore, nonce), true, Duration.seconds(ttlSeconds));
  }
}

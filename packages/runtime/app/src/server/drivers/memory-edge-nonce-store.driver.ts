/**
 * Stackra file contract:
 * Purpose: `MemoryEdgeNonceStoreDriver` (`memory`), the `EdgeNonceStore` driver that keeps seen request ids in one
 *          process's memory until they expire: the candidate of tests, local runs and a single-instance API.
 * Boundary: atomic within one process (claims run on one event loop). Expired ids are dropped on the next claim, so
 *           memory holds at most the ids of one window. Several API instances need a shared driver instead.
 * Runtime: node
 * Governing contract: ADR 0437 (decision 4 and Consequences); ADR 0266 (memory drivers first).
 */
import { Driver } from "@stackra/container";

import { EdgeNonceStore } from "#contracts/ports/edge-nonce-store.port";

/**
 * Seen edge request ids in memory.
 *
 * @example
 * await nonces.claim("req-1", 120); // true
 * await nonces.claim("req-1", 120); // false
 */
export class MemoryEdgeNonceStoreDriver extends Driver(EdgeNonceStore) {
  /** Request id to the time it expires, epoch milliseconds. */
  private readonly seen = new Map<string, number>();

  /** Records `nonce`; false while an earlier claim of it is live. */
  async claim(nonce: string, ttlSeconds: number): Promise<boolean> {
    const now = Date.now();
    for (const [id, expires] of this.seen) if (expires <= now) this.seen.delete(id);
    if (this.seen.has(nonce)) return false;
    this.seen.set(nonce, now + ttlSeconds * 1000);
    return true;
  }
}

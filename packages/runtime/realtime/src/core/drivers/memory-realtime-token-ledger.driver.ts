/**
 * Stackra file contract:
 * Purpose: the `memory` driver of the `RealtimeTokenLedger` port: redeemed token ids in this process, each kept until
 *          its token's expiry, for tests and a service on one instance.
 * Boundary: one process only; a service on two or more instances binds `valkey`, or a token redeemed on one instance
 *           could be redeemed again on another. Expired ids are swept on each claim.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1); ADR 0266 (memory first).
 */
import { Driver } from "@stackra/container";

import { RealtimeTokenLedger } from "#contracts/ports/realtime-token-ledger.port";

/** Keeps redeemed token ids in memory. */
export class MemoryRealtimeTokenLedgerDriver extends Driver(RealtimeTokenLedger) {
  /** Token id to the time it may be forgotten, in milliseconds. */
  private readonly claimed = new Map<string, number>();

  /** Claims `id` until `until`; false when it was already claimed and has not expired. */
  async claim(id: string, until: Date): Promise<boolean> {
    const now = Date.now();
    for (const [each, expiry] of this.claimed) if (expiry <= now) this.claimed.delete(each);
    if (this.claimed.has(id)) return false;
    this.claimed.set(id, until.getTime());
    return true;
  }
}

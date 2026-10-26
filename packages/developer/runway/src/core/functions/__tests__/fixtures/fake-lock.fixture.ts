/**
 * Stackra file contract:
 * Purpose: test fixture: `FakeLock`, an in-memory `DeployLock` shaped as `Locks#tryWith` that records each key and TTL
 *          it is asked for and frees a key when its work ends, however it ends.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0435.
 */
import type { Duration } from "@stackra/contracts";

import type { DeployLock } from "#core/types/deploy-lock.type";

/** An in-memory lock that records each key and TTL it is asked for. */
export class FakeLock implements DeployLock {
  /** The keys held now. */
  readonly held = new Set<string>();

  /** Each key and TTL asked for, in order. */
  readonly asked: Array<[string, Duration]> = [];

  async tryWith(key: string, ttl: Duration, work: () => Promise<void>): Promise<boolean> {
    this.asked.push([key, ttl]);
    if (this.held.has(key)) return false;
    this.held.add(key);
    try {
      await work();
      return true;
    } finally {
      this.held.delete(key);
    }
  }
}

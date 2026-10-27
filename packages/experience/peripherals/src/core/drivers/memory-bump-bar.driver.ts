/**
 * Stackra file contract:
 * Purpose: `MemoryBumpBarDriver`, the `BumpBar` driver a test presses: the default candidate, so a KDS board's bump,
 *          recall and selection are testable with no keypad.
 * Boundary: no device is touched. `press(key)` hands the key to every listener; it always answers its probe. The
 *           constructor takes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (decisions 1 and 4); ADR 0266 (memory drivers first); ADR 0269 (fakes are real
 *                     drivers); ADR 0449 (decision 2).
 */
import { Driver } from "@stackra/container";
import type { CapabilityResult } from "@stackra/platform/contracts";

import type { BumpBarKey } from "#contracts/enums/bump-bar-key.enum";
import { BumpBar } from "#contracts/ports/bump-bar.port";

/**
 * A bump bar in memory.
 *
 * @example
 * const bar = new MemoryBumpBarDriver();
 * const stop = bar.onKey((key) => seen.push(key));
 * bar.press(BumpBarKey.Bump);
 */
export class MemoryBumpBarDriver extends Driver(BumpBar) {
  /** The key listeners. */
  private readonly listeners = new Set<(key: BumpBarKey) => void>();

  /** A memory bump bar is always there. */
  async probe(): Promise<CapabilityResult> {
    return { ok: true, data: undefined };
  }

  /** Subscribes `listener` until the returned function stops it. */
  onKey(listener: (key: BumpBarKey) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Presses `key`: every listener receives it. */
  press(key: BumpBarKey): void {
    for (const listener of this.listeners) listener(key);
  }
}

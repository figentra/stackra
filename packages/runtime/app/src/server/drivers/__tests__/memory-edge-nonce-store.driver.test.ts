/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryEdgeNonceStoreDriver`: the first claim of an id wins, a second one inside its time to
 *          live loses, and an expired id can be claimed again.
 * Boundary: test only; fake timers move the clock.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0437 (decision 4).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { MemoryEdgeNonceStoreDriver } from "#server/drivers/memory-edge-nonce-store.driver";

describe("MemoryEdgeNonceStoreDriver", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("lets an id be claimed once while it lives", async () => {
    const nonces = new MemoryEdgeNonceStoreDriver();
    expect(await nonces.claim("req-1", 120)).toBe(true);
    expect(await nonces.claim("req-1", 120)).toBe(false);
    expect(await nonces.claim("req-2", 120)).toBe(true);
  });

  it("forgets an id once it expires", async () => {
    vi.useFakeTimers();
    const nonces = new MemoryEdgeNonceStoreDriver();
    expect(await nonces.claim("req-1", 1)).toBe(true);
    vi.advanceTimersByTime(1001);
    expect(await nonces.claim("req-1", 1)).toBe(true);
  });
});

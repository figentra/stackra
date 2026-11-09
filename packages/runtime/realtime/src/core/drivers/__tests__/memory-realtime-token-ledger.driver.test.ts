/**
 * Stackra file contract:
 * Purpose: unit tests of the `memory` `RealtimeTokenLedger`: the first claim of a token id wins, a second is refused,
 *          and a claim whose time has passed is forgotten, so the id can be claimed again.
 * Boundary: test only; `Date` is faked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0225 (decision 1).
 */
import { kindOf } from "@stackra/container";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { RealtimeTokenLedger } from "#contracts/ports/realtime-token-ledger.port";
import { MemoryRealtimeTokenLedgerDriver } from "#core/drivers/memory-realtime-token-ledger.driver";

const NOW = new Date("2026-10-24T09:00:00Z");

/** `seconds` after `NOW`. */
const after = (seconds: number): Date => new Date(NOW.getTime() + seconds * 1000);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("MemoryRealtimeTokenLedgerDriver", () => {
  it("is a driver of RealtimeTokenLedger", () => {
    expect(new MemoryRealtimeTokenLedgerDriver()).toBeInstanceOf(RealtimeTokenLedger);
    expect(kindOf(MemoryRealtimeTokenLedgerDriver)).toEqual({
      kind: "driver",
      options: { port: RealtimeTokenLedger },
    });
  });

  it("grants the first claim of an id and refuses the next", async () => {
    const ledger = new MemoryRealtimeTokenLedgerDriver();
    await expect(ledger.claim("tok_1", after(60))).resolves.toBe(true);
    await expect(ledger.claim("tok_1", after(60))).resolves.toBe(false);
    await expect(ledger.claim("tok_2", after(60))).resolves.toBe(true);
  });

  it("lets an id whose claim has expired be claimed again", async () => {
    const ledger = new MemoryRealtimeTokenLedgerDriver();
    await expect(ledger.claim("tok_1", after(-1))).resolves.toBe(true);
    await expect(ledger.claim("tok_1", after(60))).resolves.toBe(true);
    await expect(ledger.claim("tok_1", after(60))).resolves.toBe(false);
  });

  it("forgets a claim when its time comes", async () => {
    const ledger = new MemoryRealtimeTokenLedgerDriver();
    await ledger.claim("tok_1", after(30));
    vi.advanceTimersByTime(30_000);
    await expect(ledger.claim("tok_1", after(60))).resolves.toBe(true);
  });
});

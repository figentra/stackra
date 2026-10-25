/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryRateSourceDriver`: it answers the latest snapshot of the exact pair at or before the
 *          instant asked, and refuses when there is none rather than guessing.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0220 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import type { RateSnapshot } from "#contracts/types/rate-snapshot.type";
import { MemoryRateSourceDriver } from "#core/drivers/memory-rate-source.driver";

const gold = { base: "XAU", quote: "SAR", unit: "gram" } as const;

/** A gold snapshot at `iso` with `rate`. */
const goldAt = (iso: string, rate: string): RateSnapshot => ({
  ...gold,
  rate,
  source: "memory",
  at: new Date(iso),
});

describe("MemoryRateSourceDriver", () => {
  it("answers the latest snapshot at or before the instant", async () => {
    const rates = new MemoryRateSourceDriver();
    rates.snapshots.push(
      goldAt("2026-10-25T08:00:00Z", "251.42"),
      goldAt("2026-10-23T08:00:00Z", "249.10"),
      goldAt("2026-10-26T08:00:00Z", "252.00"),
      { ...goldAt("2026-10-25T09:00:00Z", "3.10"), base: "XAG" },
    );
    expect((await rates.rate(gold, new Date("2026-10-25T12:00:00Z"))).rate).toBe("251.42");
    expect((await rates.rate(gold, new Date("2026-10-25T08:00:00Z"))).rate).toBe("251.42");
    expect((await rates.rate(gold, new Date("2026-10-24T00:00:00Z"))).rate).toBe("249.10");
  });

  it("refuses a pair or an instant it has no rate for", async () => {
    const rates = new MemoryRateSourceDriver();
    rates.snapshots.push(goldAt("2026-10-25T08:00:00Z", "251.42"));
    await expect(rates.rate(gold, new Date("2026-10-24T00:00:00Z"))).rejects.toThrow(RangeError);
    await expect(
      rates.rate({ base: "USD", quote: "SAR", unit: null }, new Date("2026-10-26T00:00:00Z")),
    ).rejects.toThrow(RangeError);
    await expect(
      rates.rate({ ...gold, unit: "troy_ounce" }, new Date("2026-10-26T00:00:00Z")),
    ).rejects.toThrow(RangeError);
  });
});

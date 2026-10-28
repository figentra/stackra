/**
 * Stackra file contract:
 * Purpose: unit tests of the `MeterTotals` and `QuotaWarnings` ports: both are abstract `Port`s (their own tokens),
 *          a totals driver sums one meter in one scope and window, and a warnings driver hears every argument.
 * Boundary: test only; the drivers here are stand-ins for the usage service's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0263 (ports); ADR 0216.
 */
import { Driver } from "@stackra/container";
import { Port, type PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { MeterTotals } from "#contracts/ports/meter-totals.port";
import { QuotaWarnings } from "#contracts/ports/quota-warnings.port";

class ListMeterTotalsDriver extends Driver(MeterTotals) {
  readonly rows: readonly [string, PublicId, string, number][] = [
    ["ai.tokens", "scp_1", "2026-10-02T00:00:00Z", 40],
    ["ai.tokens", "scp_1", "2026-10-20T00:00:00Z", 2],
    ["ai.tokens", "scp_1", "2026-09-30T00:00:00Z", 100],
    ["ai.tokens", "scp_2", "2026-10-03T00:00:00Z", 7],
    ["exports.bytes", "scp_1", "2026-10-03T00:00:00Z", 9],
  ];

  async total(meter: string, scope: PublicId | undefined, from: Date, to: Date): Promise<number> {
    return this.rows
      .filter(([name, owner, at]) => {
        const time = new Date(at).getTime();
        return name === meter && owner === scope && time >= from.getTime() && time < to.getTime();
      })
      .reduce((sum, [, , , value]) => sum + value, 0);
  }
}

class ListQuotaWarningsDriver extends Driver(QuotaWarnings) {
  readonly heard: unknown[][] = [];

  async warn(
    entitlement: string,
    scope: PublicId | undefined,
    used: number,
    limit: number,
  ): Promise<void> {
    this.heard.push([entitlement, scope, used, limit]);
  }
}

describe("MeterTotals", () => {
  it("is an abstract port", () => {
    expect(MeterTotals.prototype).toBeInstanceOf(Port);
  });

  it("is implemented by a driver that totals one meter in one scope and window", async () => {
    const totals = new ListMeterTotalsDriver();
    const from = new Date("2026-10-01T00:00:00Z");
    const to = new Date("2026-11-01T00:00:00Z");
    await expect(totals.total("ai.tokens", "scp_1", from, to)).resolves.toBe(42);
    await expect(totals.total("ai.tokens", undefined, from, to)).resolves.toBe(0);
  });
});

describe("QuotaWarnings", () => {
  it("is an abstract port whose driver hears every argument", async () => {
    expect(QuotaWarnings.prototype).toBeInstanceOf(Port);
    const warnings = new ListQuotaWarningsDriver();
    await warnings.warn("ai.token_quota", "scp_1", 120, 100);
    expect(warnings.heard).toEqual([["ai.token_quota", "scp_1", 120, 100]]);
  });
});

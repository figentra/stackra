/**
 * Stackra file contract:
 * Purpose: unit tests of the `OfflineCapStore` port: it is an abstract `Port` (its own token, never built directly) and
 *          a driver records applied calls and reports their usage.
 * Boundary: test only; the driver here is a stand-in for the implementing package's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0263 (ports); ADR 0338 (decision 5).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { OfflineCapStore } from "#contracts/ports/offline-cap-store.port";
import type { OfflineCapUsage } from "#contracts/types/offline-cap-usage.type";

class TallyDriver extends Driver(OfflineCapStore) {
  readonly amounts: number[] = [];

  async usage(): Promise<OfflineCapUsage> {
    return { count: this.amounts.length, amount: this.amounts.reduce((sum, a) => sum + a, 0) };
  }

  async record(_deviceId: string, _key: string, _at: Date, amount: number): Promise<void> {
    this.amounts.push(amount);
  }
}

describe("OfflineCapStore", () => {
  it("is an abstract port", () => {
    expect(OfflineCapStore.prototype).toBeInstanceOf(Port);
  });

  it("is implemented by a driver", async () => {
    const driver: OfflineCapStore = new TallyDriver();
    await driver.record("dev_1", "gift_cards.gift_card.redeem@1", new Date(), 2500);
    expect(await driver.usage("dev_1", "gift_cards.gift_card.redeem@1", new Date(0))).toEqual({
      count: 1,
      amount: 2500,
    });
  });
});

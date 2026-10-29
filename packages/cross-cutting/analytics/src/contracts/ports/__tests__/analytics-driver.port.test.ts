/**
 * Stackra file contract:
 * Purpose: type and shape tests of the `AnalyticsDriver` port: an abstract port class with one asynchronous `send` of
 *          an ordered list of deliveries, a `beacon` that answers `false` by default and an `erasePerson` that rejects
 *          by default (a driver that cannot erase never reports success), and a driver of it is an instance of it.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 16 and 17); STA-1582.
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { AnalyticsDriver } from "#contracts/ports/analytics-driver.port";
import type { AnalyticsDelivery } from "#contracts/types/analytics-delivery.type";

/** The smallest driver of the port. */
class CountingAnalyticsDriver extends Driver(AnalyticsDriver) {
  count = 0;

  send(deliveries: readonly AnalyticsDelivery[]): Promise<void> {
    this.count += deliveries.length;
    return Promise.resolve();
  }
}

describe("AnalyticsDriver", () => {
  it("is a port, and its drivers are instances of it", async () => {
    const driver = new CountingAnalyticsDriver();
    expect(driver).toBeInstanceOf(AnalyticsDriver);
    expect(driver).toBeInstanceOf(Port);
    await driver.send([
      {
        eventId: "evt_01jbadk0g0aaaaaaaaaaaaaaaa",
        anonymousId: "anon_01jbadk0g0bbbbbbbbbbbbbbbb",
        sessionId: "ses_01jbadk0g0cccccccccccccccc",
        context: { library: { name: "@stackra/analytics" } },
        name: "scan.barcode_scanned",
        properties: { found: true },
        occurredAt: "2026-10-24T09:00:00Z",
      },
    ]);
    expect(driver.count).toBe(1);
  });

  it("types send as an ordered, asynchronous hand-off", () => {
    expectTypeOf<AnalyticsDriver["send"]>().parameters.toEqualTypeOf<
      [readonly AnalyticsDelivery[]]
    >();
    expectTypeOf<AnalyticsDriver["send"]>().returns.toEqualTypeOf<Promise<void>>();
  });

  it("answers false to a beacon unless a driver can send one", () => {
    expect(new CountingAnalyticsDriver().beacon([])).toBe(false);
    expectTypeOf<AnalyticsDriver["beacon"]>().returns.toEqualTypeOf<boolean>();
  });

  it("rejects an erasure unless a driver can erase at its vendor", async () => {
    await expect(new CountingAnalyticsDriver().erasePerson("usr_1")).rejects.toThrow(
      "CountingAnalyticsDriver cannot erase a person at its analytics vendor",
    );
    expectTypeOf<AnalyticsDriver["erasePerson"]>().parameters.toEqualTypeOf<[string]>();
    expectTypeOf<AnalyticsDriver["erasePerson"]>().returns.toEqualTypeOf<Promise<number>>();
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryAnalyticsDriver`: a driver of `AnalyticsDriver` that keeps every delivery in order,
 *          readable right after `send`, and hands out copies so a test cannot rewrite what was sent; `erasePerson` records
 *          every subject and drops only that subject's deliveries.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0266 (decision 2); STA-1582.
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { AnalyticsDriver } from "#contracts/index";
import { MemoryAnalyticsDriver } from "#core/drivers/memory-analytics.driver";

/** A delivery named `name`. */
const delivery = (name: string) => ({
  eventId: "evt_01jbadk0g0aaaaaaaaaaaaaaaa",
  anonymousId: "anon_01jbadk0g0bbbbbbbbbbbbbbbb",
  sessionId: "ses_01jbadk0g0cccccccccccccccc",
  context: { library: { name: "@stackra/analytics" } },
  name,
  properties: {},
  occurredAt: "2026-10-24T09:00:00.000Z",
});

describe("MemoryAnalyticsDriver", () => {
  it("is a driver of the port", () => {
    expect(new MemoryAnalyticsDriver()).toBeInstanceOf(AnalyticsDriver);
    expect(kindOf(MemoryAnalyticsDriver)?.kind).toBe("driver");
  });

  it("keeps deliveries in order across sends", () => {
    const driver = new MemoryAnalyticsDriver();
    void driver.send([delivery("lead.submitted"), delivery("scan.barcode_scanned")]);
    void driver.send([delivery("newsletter.joined")]);
    expect(driver.delivered().map((item) => item.name)).toEqual([
      "lead.submitted",
      "scan.barcode_scanned",
      "newsletter.joined",
    ]);
  });

  it("hands out a copy", () => {
    const driver = new MemoryAnalyticsDriver();
    void driver.send([delivery("lead.submitted")]);
    (driver.delivered() as unknown[]).length = 0;
    expect(driver.delivered()).toHaveLength(1);
  });

  it("records each erased subject and drops only its deliveries", async () => {
    const driver = new MemoryAnalyticsDriver();
    await driver.send([
      { ...delivery("lead.submitted"), userId: "usr_1" },
      { ...delivery("newsletter.joined"), userId: "usr_2" },
    ]);
    await expect(driver.erasePerson("usr_1")).resolves.toBe(1);
    await expect(driver.erasePerson("usr_9")).resolves.toBe(0);
    expect(driver.erased()).toEqual(["usr_1", "usr_9"]);
    expect(driver.delivered().map((item) => item.name)).toEqual(["newsletter.joined"]);
  });
});

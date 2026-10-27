/**
 * Stackra file contract:
 * Purpose: unit tests of `RegionBusFake`: it is a `RegionBus`, remembers every send in `sent()` and records each call.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 2: port fakes); STA-1268.
 */
import { describe, expect, it } from "@stackra/testing";

import { RegionBus } from "#contracts/index";
import { RegionBusFake } from "#testing/region-bus.fake";

const first = { event: {}, meta: { id: "evt_1", occurredAt: new Date(0) } };
const second = { event: {}, meta: { id: "evt_2", occurredAt: new Date(1) } };

describe("RegionBusFake", () => {
  it("is a RegionBus", () => {
    expect(new RegionBusFake()).toBeInstanceOf(RegionBus);
  });

  it("remembers every send", async () => {
    const bus = new RegionBusFake();
    await bus.send([first]);
    await bus.send([second]);
    expect(bus.sent()).toEqual([first, second]);
    expect(bus.calls("send")).toEqual([[first], [second]]);
  });
});

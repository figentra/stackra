/**
 * Stackra file contract:
 * Purpose: unit tests of `dispatch`: it publishes on the current app's bus with the metadata given, runs no listener
 *          until a drain, and throws before any app compiled.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3); ADR 0078 (decision 4).
 */
import { Module } from "@stackra/container";
import { createTestingModule, registerWiring } from "@stackra/container/testing";
import { describe, expect, it } from "@stackra/testing";

import { DomainEvent, Listener, registerListeners } from "#core/index";
import "#testing/index";
import { dispatch } from "#testing/functions/dispatch.function";
import { drainEvents } from "#testing/functions/drain-events.function";

class PointsRedeemed extends DomainEvent {}

class CountListener extends Listener {
  count = 0;

  async handle(_event: PointsRedeemed): Promise<void> {
    this.count += 1;
  }
}

class FixtureModule extends Module {}

registerListeners([[PointsRedeemed, CountListener]]);
registerWiring({
  member: "fixture",
  root: FixtureModule,
  bindings: [{ module: "fixture", provide: CountListener, deps: [] }],
});

describe(dispatch, () => {
  it("throws before an app compiled", async () => {
    await expect(dispatch(new PointsRedeemed())).rejects.toThrow(/createTestingModule/);
  });

  it("publishes with the metadata given and waits for the drain", async () => {
    const app = await createTestingModule(FixtureModule).compile();
    const event = new PointsRedeemed();
    const record = await dispatch(event, { id: "evt_1", tenantId: "tnt_1" });

    expect(record.event).toBe(event);
    expect(record.meta).toMatchObject({ id: "evt_1", tenantId: "tnt_1" });
    expect(app.get(CountListener).count).toBe(0);
    await drainEvents();
    expect(app.get(CountListener).count).toBe(1);
    expect(app.events.published()).toEqual([event]);
  });
});

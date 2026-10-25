/**
 * Stackra file contract:
 * Purpose: unit tests of `drainEvents`: it runs the current app's queued events through their listeners, returns the
 *          deliveries with failures instead of throwing, and leaves the outbox alone.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3); ADR 0078 (decisions 2 and 4).
 */
import { Module } from "@stackra/container";
import { createTestingModule, registerWiring } from "@stackra/container/testing";
import { describe, expect, it } from "@stackra/testing";

import { DomainEvent, Listener, registerListeners } from "#core/index";
import "#testing/index";
import { currentHarness } from "#testing/functions/current-harness.function";
import { dispatch } from "#testing/functions/dispatch.function";
import { drainEvents } from "#testing/functions/drain-events.function";
import { OutboxFake } from "#testing/outbox.fake";

class StockLow extends DomainEvent {}

class FailingListener extends Listener {
  async handle(_event: StockLow): Promise<void> {
    throw new RangeError("down");
  }
}

class FixtureModule extends Module {}

registerListeners([[StockLow, FailingListener]]);
registerWiring({
  member: "fixture",
  root: FixtureModule,
  bindings: [{ module: "fixture", provide: FailingListener, deps: [] }],
});

describe(drainEvents, () => {
  it("returns the deliveries, failures included, and leaves the outbox alone", async () => {
    await createTestingModule(FixtureModule).compile();
    const outbox = currentHarness().outbox as OutboxFake;
    await outbox.write([
      { event: new StockLow(), meta: { id: "evt_out", occurredAt: new Date(0) } },
    ]);
    await dispatch(new StockLow());

    const deliveries = await drainEvents();

    expect(deliveries).toHaveLength(1);
    expect(deliveries[0]?.error).toBeInstanceOf(RangeError);
    expect(outbox.take()).toHaveLength(1);
    expect(await drainEvents()).toEqual([]);
  });
});

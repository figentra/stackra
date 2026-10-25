/**
 * Stackra file contract:
 * Purpose: unit tests of the events testing plugin: on compile it subscribes the registered listeners the app binds,
 *          uses the app's own `EventBus` and `EventOutbox` when bound (else its own bus and an `OutboxFake`), and adds
 *          `app.events.published()` and `app.listeners.calls` / `.failures`.
 * Boundary: test only; registers a wiring the way gen's vitest setup does, and the plugin by importing the entry.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3); ADR 0263 (decision 12).
 */
import { Module } from "@stackra/container";
import { createTestingModule, registerWiring } from "@stackra/container/testing";
import { Clock } from "@stackra/contracts";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { EventOutbox } from "#contracts/index";
import { DomainEvent, EventBus, Listener, registerListeners } from "#core/index";
import { EVENTS_TESTING_PLUGIN } from "#testing/index";
import { currentHarness } from "#testing/functions/current-harness.function";
import { dispatch } from "#testing/functions/dispatch.function";
import { drainEvents } from "#testing/functions/drain-events.function";
import { OutboxFake } from "#testing/outbox.fake";

class StockLow extends DomainEvent {}

class OrderPaid extends DomainEvent {}

class AlertListener extends Listener {
  readonly handled: unknown[] = [];

  async handle(event: StockLow): Promise<void> {
    this.handled.push(event);
  }
}

class BrokenListener extends Listener {
  async handle(_event: StockLow): Promise<void> {
    throw new RangeError("down");
  }
}

class UnboundListener extends Listener {
  async handle(_event: StockLow): Promise<void> {}
}

class FixtureModule extends Module {}

registerListeners([
  [StockLow, AlertListener],
  [StockLow, BrokenListener],
  [StockLow, UnboundListener],
]);

beforeEach(() => {
  registerWiring({
    member: "fixture",
    root: FixtureModule,
    bindings: [
      { module: "fixture", provide: AlertListener, deps: [] },
      { module: "fixture", provide: BrokenListener, deps: [] },
    ],
  });
});

describe("EVENTS_TESTING_PLUGIN", () => {
  it("is named after the package", () => {
    expect(EVENTS_TESTING_PLUGIN.name).toBe("@stackra/events");
  });

  it("subscribes the bound listeners and reports their deliveries", async () => {
    const app = await createTestingModule(FixtureModule).compile();
    const low = new StockLow();
    await dispatch(low);
    await dispatch(new OrderPaid());
    await drainEvents();

    expect(app.get(AlertListener).handled).toEqual([low]);
    expect(app.listeners.calls(AlertListener)).toHaveLength(1);
    expect(app.listeners.failures(AlertListener)).toHaveLength(0);
    expect(app.listeners.failures(BrokenListener)).toHaveLength(1);
    expect(app.listeners.calls(UnboundListener)).toHaveLength(0);
    expect(app.events.published().ofType(StockLow)).toEqual([low]);
    expect(app.events.published()).toHaveLength(2);
  });

  it("falls back to its own bus and an OutboxFake", async () => {
    await createTestingModule(FixtureModule).compile();
    expect(currentHarness().bus).toBeInstanceOf(EventBus);
    expect(currentHarness().outbox).toBeInstanceOf(OutboxFake);
  });

  it("uses the app's own bus and outbox when bound", async () => {
    const outbox = new OutboxFake();
    registerWiring({
      member: "fixture",
      root: FixtureModule,
      bindings: [{ module: "fixture", provide: EventBus, deps: [Clock] }],
    });
    const app = await createTestingModule(FixtureModule).override(EventOutbox, outbox).compile();

    expect(currentHarness().bus).toBe(app.get(EventBus));
    expect(currentHarness().outbox).toBe(outbox);
  });
});

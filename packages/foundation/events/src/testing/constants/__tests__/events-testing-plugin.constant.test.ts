/**
 * Stackra file contract:
 * Purpose: unit tests of the events testing plugin: on compile it subscribes the registered listeners the app binds
 *          and can build (one whose dependency nothing binds is skipped; a constructor's error still throws),
 *          uses the app's own `EventBus` and `EventOutbox` when bound (else its own bus and an `OutboxFake`), and adds
 *          `app.events.published()` and `app.listeners.calls` / `.failures`.
 * Boundary: test only; registers a wiring the way gen's vitest setup does, and the plugin by importing the entry.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3); ADR 0263 (decision 12).
 */
import { Driver, Module } from "@stackra/container";
import { createTestingModule, registerWiring } from "@stackra/container/testing";
import { Clock } from "@stackra/contracts";
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

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

/** A dependency no test binds, as `QueueService` in an app that boots no queue module. */
class Missing {}

class NeedsMissingListener extends Listener {
  constructor(readonly missing: Missing) {
    super();
  }

  async handle(_event: StockLow): Promise<void> {}
}

class ThrowingListener extends Listener {
  constructor() {
    super();
    throw new RangeError("broken constructor");
  }

  async handle(_event: StockLow): Promise<void> {}
}

class FixtureModule extends Module {}

/** The real outbox gen wires for the pipeline (`@stackra/outbox`'s, in a service). */
class TableOutboxDriver extends Driver(EventOutbox) {
  async write(): Promise<void> {}
}

/** The fixture's wiring with gen's real outbox as `EventOutbox`'s only candidate (#706). */
const withRealOutbox = () =>
  registerWiring({
    member: "fixture",
    root: FixtureModule,
    bindings: [],
    drivers: [
      {
        port: EventOutbox,
        key: "events.EventOutbox",
        candidates: { outbox: () => Promise.resolve(TableOutboxDriver) },
      },
    ],
  });

registerListeners([
  [StockLow, AlertListener],
  [StockLow, BrokenListener],
  [StockLow, UnboundListener],
  [StockLow, NeedsMissingListener],
  [StockLow, ThrowingListener],
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

  it("skips a listener whose dependency nothing binds, and still throws a constructor's error (STA-1740)", async () => {
    // In another member's wiring with no root, as SendWebhooksListener beside a webhooks fixture: the container builds
    // every singleton of the modules the root's wiring binds at compile, so there it would fail the compile first.
    registerWiring({
      member: "elsewhere",
      bindings: [{ module: "elsewhere", provide: NeedsMissingListener, deps: [Missing] }],
    });
    try {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const app = await createTestingModule(FixtureModule).compile();
      expect(warn).toHaveBeenCalledWith(
        "events testing: skipped NeedsMissingListener: nothing binds Missing",
      );
      warn.mockRestore();
      expect(app.listeners.skipped()).toEqual([
        { listener: NeedsMissingListener, missing: Missing },
      ]);
      await dispatch(new StockLow());
      await drainEvents();
      expect(app.listeners.calls(NeedsMissingListener)).toHaveLength(0);
    } finally {
      // the registry outlives the test: leave the other member with nothing to bind
      registerWiring({ member: "elsewhere", bindings: [] });
    }

    registerWiring({
      member: "fixture",
      root: FixtureModule,
      bindings: [{ module: "fixture", provide: ThrowingListener, deps: [] }],
    });
    await expect(createTestingModule(FixtureModule).compile()).rejects.toThrow(
      "broken constructor",
    );
  });

  it("falls back to its own bus and an OutboxFake", async () => {
    const app = await createTestingModule(FixtureModule).compile();
    expect(app.listeners.skipped()).toEqual([]);
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

  /** Gen binds the real outbox for the pipeline; a memory test still gets the fake, so recorded events are seen. */
  it("binds the OutboxFake under useDrivers(memory) where gen wires the real outbox", async () => {
    withRealOutbox();

    const memory = await createTestingModule(FixtureModule).useDrivers("memory").compile();
    expect(memory.get(EventOutbox)).toBeInstanceOf(OutboxFake);
    expect(currentHarness().outbox).toBe(memory.get(EventOutbox));

    const explicit = new OutboxFake();
    const overridden = await createTestingModule(FixtureModule)
      .useDrivers("memory")
      .override(EventOutbox, explicit)
      .compile();
    expect(overridden.get(EventOutbox)).toBe(explicit);

    const real = await createTestingModule(FixtureModule).compile();
    expect(real.get(EventOutbox)).toBeInstanceOf(TableOutboxDriver);
  });
});

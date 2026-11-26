/**
 * Stackra file contract:
 * Purpose: `EVENTS_TESTING_PLUGIN`, the testing-module plugin of @stackra/events: on every `compile()` it connects the
 *          app's bus to the listeners gen registered, makes that app the one the event helpers act on, and adds
 *          `app.events.published()` and `app.listeners.calls(X)` / `.failures(X)`. Declared on `TestingApp` here and
 *          registered when this module loads.
 * Boundary: uses the app's own `EventBus` and `EventOutbox` when it binds them, else a bus on the app's clock and an
 *           `OutboxFake`. Offers `OutboxFake` as `EventOutbox`'s `memory` test driver, so `.useDrivers("memory")` binds
 *           it rather than the real outbox gen wires for the pipeline; a production container never sees it. Each compile replaces the current app; nothing is shared between apps. A listener the app
 *           cannot build because a dependency has no binding is skipped (STA-1740) and listed by `app.listeners.skipped()`.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0263 (decision 12); the STA-348 registry row (builder extension point).
 */
import { UnboundTokenError, UnresolvedPortError } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import { registerTestingPlugin } from "@stackra/container/testing";
import type { TestingApp, TestingPlugin } from "@stackra/container/testing";
import { Clock } from "@stackra/contracts";

import { EventOutbox } from "#contracts/index";
import { EventBus } from "#core/index";
import type { Listener, ListenerDelivery } from "#core/index";
import { CURRENT_HARNESS } from "#testing/constants/current-harness.constant";
import { publishedEvents } from "#testing/functions/published-events.function";
import { OutboxFake } from "#testing/outbox.fake";
import type { EventsHarness } from "#testing/types/events-harness.type";
import type { PublishedEvents } from "#testing/types/published-events.type";

declare module "@stackra/container/testing" {
  interface TestingApp {
    /** The events this app published. */
    readonly events: {
      /** Every event published so far, in process or through the outbox, oldest first. */
      published: () => PublishedEvents;
    };

    /** The deliveries this app's bus made. */
    readonly listeners: {
      /** Every delivery to a listener of `type`, oldest first, failures included. */
      calls: (type: AnyClass<Listener>) => readonly ListenerDelivery[];

      /** The deliveries to a listener of `type` whose `handle` threw. */
      failures: (type: AnyClass<Listener>) => readonly ListenerDelivery[];

      /** The listeners skipped because nothing binds a dependency, with the class missing, in skip order. */
      skipped: () => readonly { listener: AnyClass<Listener>; missing: AnyClass }[];
    };
  }
}

/** The deliveries to listeners of `type`. */
function callsOf(harness: EventsHarness, type: AnyClass<Listener>): readonly ListenerDelivery[] {
  return harness.bus.deliveries().filter((delivery) => delivery.listener instanceof type);
}

/**
 * The listener `app` builds for `type`, or undefined, with a warning naming the listener and the class, when a
 * dependency has no binding, as for a listener of a module the test did not boot (STA-1740); any other error building
 * it still throws.
 */
function built(
  app: TestingApp,
  type: AnyClass,
  skipped: { listener: AnyClass<Listener>; missing: AnyClass }[],
): object | undefined {
  try {
    return app.get(type);
  } catch (error) {
    const missing =
      error instanceof UnboundTokenError
        ? error.token
        : error instanceof UnresolvedPortError
          ? error.port
          : undefined;
    if (missing === undefined) throw error;
    skipped.push({ listener: type as AnyClass<Listener>, missing });
    // oxlint-disable-next-line no-console -- reason: a skipped listener must stay visible, so a wiring bug cannot hide in a test
    console.warn(`events testing: skipped ${type.name}: nothing binds ${missing.name}`);
    return undefined;
  }
}

/**
 * The plugin; registered with the testing module when this module loads.
 *
 * @example
 * const app = await createTestingModule(CommerceModule).useDrivers("memory").compile();
 * await drainOutbox();
 * expect(app.listeners.failures(MarkOrderPaidListener)).toHaveLength(0);
 */
export const EVENTS_TESTING_PLUGIN: TestingPlugin = {
  name: "@stackra/events",
  // `.useDrivers("memory")` picks the fake outbox even where gen binds the real one for the pipeline (#706), so
  // `drainOutbox`, `toRecord` and `app.events.published()` see what a call wrote; an `.override(EventOutbox, …)` still wins.
  drivers: [
    {
      port: EventOutbox,
      key: "events.EventOutbox",
      candidates: { memory: () => Promise.resolve(OutboxFake) },
    },
  ],
  app(app: TestingApp) {
    const clock = app.get(Clock);
    const bus = app.has(EventBus) ? app.get(EventBus) : new EventBus(clock);
    const instances = new Map<AnyClass, object>();
    const skipped: { listener: AnyClass<Listener>; missing: AnyClass }[] = [];
    bus.connect({
      has: (type) => {
        const instance = app.has(type) ? built(app, type, skipped) : undefined;
        // kept so `get` hands back this instance: a transient listener is built once
        if (instance !== undefined) instances.set(type, instance);
        return instance !== undefined;
      },
      get: <T extends object>(type: AnyClass<T>) =>
        (instances.get(type) as T | undefined) ?? app.get(type),
    });
    const outbox = app.has(EventOutbox) ? app.get(EventOutbox) : new OutboxFake();
    const harness: EventsHarness = {
      bus,
      outbox,
      clock,
      inbox: [],
      seen: new Set(),
      app,
      scopes: new Map(),
    };
    CURRENT_HARNESS.value = harness;
    return {
      events: { published: () => publishedEvents(harness) },
      listeners: {
        calls: (type: AnyClass<Listener>) => callsOf(harness, type),
        failures: (type: AnyClass<Listener>) =>
          callsOf(harness, type).filter((delivery) => "error" in delivery),
        skipped: () => [...skipped],
      },
    };
  },
};

registerTestingPlugin(EVENTS_TESTING_PLUGIN);

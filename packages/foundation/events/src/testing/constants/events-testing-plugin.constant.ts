/**
 * Stackra file contract:
 * Purpose: `EVENTS_TESTING_PLUGIN`, the testing-module plugin of @stackra/events: on every `compile()` it connects the
 *          app's bus to the listeners gen registered, makes that app the one the event helpers act on, and adds
 *          `app.events.published()` and `app.listeners.calls(X)` / `.failures(X)`. Declared on `TestingApp` here and
 *          registered when this module loads.
 * Boundary: uses the app's own `EventBus` and `EventOutbox` when it binds them, else a bus on the app's clock and an
 *           `OutboxFake`. Each compile replaces the current app; nothing is shared between apps.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0263 (decision 12); the STA-348 registry row (builder extension point).
 */
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
      published(): PublishedEvents;
    };

    /** The deliveries this app's bus made. */
    readonly listeners: {
      /** Every delivery to a listener of `type`, oldest first, failures included. */
      calls(type: AnyClass<Listener>): readonly ListenerDelivery[];

      /** The deliveries to a listener of `type` whose `handle` threw. */
      failures(type: AnyClass<Listener>): readonly ListenerDelivery[];
    };
  }
}

/** The deliveries to listeners of `type`. */
function callsOf(harness: EventsHarness, type: AnyClass<Listener>): readonly ListenerDelivery[] {
  return harness.bus.deliveries().filter((delivery) => delivery.listener instanceof type);
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
  app(app: TestingApp) {
    const bus = app.has(EventBus) ? app.get(EventBus) : new EventBus(app.get(Clock));
    bus.connect(app);
    const outbox = app.has(EventOutbox) ? app.get(EventOutbox) : new OutboxFake();
    const harness: EventsHarness = { bus, outbox, inbox: [], seen: new Set() };
    CURRENT_HARNESS.value = harness;
    return {
      events: { published: () => publishedEvents(harness) },
      listeners: {
        calls: (type: AnyClass<Listener>) => callsOf(harness, type),
        failures: (type: AnyClass<Listener>) =>
          callsOf(harness, type).filter((delivery) => "error" in delivery),
      },
    };
  },
};

registerTestingPlugin(EVENTS_TESTING_PLUGIN);

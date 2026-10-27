/**
 * Stackra file contract:
 * Purpose: unit tests of `defineEventsDevtools`: the `events.listeners` tab lists the registered listener classes by
 *          event, the `events.deliveries` tab lists the bus's deliveries by name with the failure message and no
 *          payload, and the remover removes both tabs.
 * Boundary: test only; a recording fake stands in for `DevtoolsKit` (the kit depends on this package) and a fixed
 *           clock for the Clock port.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0246 (decision 4).
 */
import type { DevtoolsTabSink, DevtoolsTabSinkDefinition } from "@stackra/container/devtools";
import type { Clock } from "@stackra/contracts";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { DomainEvent } from "#core/bases/domain-event.base";
import { Listener } from "#core/bases/listener.base";
import { LISTENER_REGISTRY } from "#core/constants/listener-registry.constant";
import { registerListeners } from "#core/functions/register-listeners.function";
import { EventBus } from "#core/services/event-bus.service";
import { defineEventsDevtools } from "#devtools/functions/define-events-devtools.function";

const clock = { now: () => new Date("2026-10-27T09:00:00Z") } as Clock;

class StockLow extends DomainEvent {
  readonly sku = "sku_secret_payload";
}

class NotifyBuyer extends Listener {
  async handle(): Promise<void> {}
}

class FailingListener extends Listener {
  async handle(): Promise<void> {
    throw new RangeError("ledger offline");
  }
}

/** A kit fake that records every defined tab and every removal. */
function fakeKit(): DevtoolsTabSink & {
  readonly tabs: Map<string, DevtoolsTabSinkDefinition>;
  readonly removed: string[];
} {
  const tabs = new Map<string, DevtoolsTabSinkDefinition>();
  const removed: string[] = [];
  return {
    tabs,
    removed,
    defineTab: (definition) => {
      tabs.set(definition.id, definition);
      return () => {
        removed.push(definition.id);
      };
    },
  };
}

beforeEach(() => {
  LISTENER_REGISTRY.clear();
});

describe("defineEventsDevtools", () => {
  it("lists the registered listeners by event class", () => {
    registerListeners([
      [StockLow, NotifyBuyer],
      [StockLow, FailingListener],
    ]);
    const kit = fakeKit();
    defineEventsDevtools(kit, new EventBus(clock));
    expect(kit.tabs.get("events.listeners")?.read()).toEqual([
      { event: "StockLow", listeners: ["NotifyBuyer", "FailingListener"] },
    ]);
  });

  it("lists the deliveries by name, with the failure message and without the payload", async () => {
    const bus = new EventBus(clock);
    bus.subscribe(StockLow, new NotifyBuyer());
    bus.subscribe(StockLow, new FailingListener());
    const record = bus.dispatch(new StockLow());
    await bus.drain();
    const kit = fakeKit();
    defineEventsDevtools(kit, bus);
    const rows = kit.tabs.get("events.deliveries")?.read();
    expect(rows).toEqual([
      { event: "StockLow", eventId: record.meta.id, listener: "NotifyBuyer", ok: true },
      {
        event: "StockLow",
        eventId: record.meta.id,
        listener: "FailingListener",
        ok: false,
        error: "ledger offline",
      },
    ]);
    expect(JSON.stringify(rows)).not.toContain("sku_secret_payload");
  });

  it("defines non-sensitive tabs in the events category and removes both", () => {
    const kit = fakeKit();
    const remove = defineEventsDevtools(kit, new EventBus(clock));
    for (const tab of kit.tabs.values()) {
      expect(tab.category).toBe("events");
      expect(tab.sensitive).toBeUndefined();
    }
    remove();
    expect(kit.removed).toEqual(["events.listeners", "events.deliveries"]);
  });
});

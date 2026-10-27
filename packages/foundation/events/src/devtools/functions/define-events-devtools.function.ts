/**
 * Stackra file contract:
 * Purpose: `defineEventsDevtools`, the devtools entry of @stackra/events: the `events.listeners` tab (each event class
 *          and the listener classes gen registered for it) and the `events.deliveries` tab (each delivery the bus made:
 *          event, event id, listener, and the error message when it failed).
 * Boundary: data only, no UI and no Pro import; the Pro panel (@stackra-pro/devtools) finds the tabs through the
 *           kit's host session. Names and ids only, never payloads: the kit's own `bus` channel already carries each
 *           event as it is, so neither tab is sensitive. Development only (ADR 0246 decision 1). It takes the kit by
 *           shape (`DevtoolsTabSink`), because @stackra/devtools-kit depends on this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0246 (decisions 1, 3 and 4); ADR 0461; ADR 0078 (a delivery's failure is recorded on it).
 */
import type { DevtoolsTabSink } from "@stackra/container/devtools";

import { LISTENER_REGISTRY } from "#core/constants/listener-registry.constant";
import type { EventBus } from "#core/services/event-bus.service";

/**
 * Defines the events devtools tabs.
 *
 * @param kit - the devtools kit (`DevtoolsKit`), or anything with its `defineTab`.
 * @param bus - the in-process event bus.
 * @returns removes both tabs.
 * @example
 * defineEventsDevtools(container.get(DevtoolsKit), container.get(EventBus));
 */
export function defineEventsDevtools(kit: DevtoolsTabSink, bus: EventBus): () => void {
  const removeListeners = kit.defineTab({
    id: "events.listeners",
    title: "Event listeners",
    category: "events",
    read: () =>
      [...LISTENER_REGISTRY].map(([event, listeners]) => ({
        event: event.name,
        listeners: listeners.map((listener) => listener.name),
      })),
  });
  const removeDeliveries = kit.defineTab({
    id: "events.deliveries",
    title: "Event deliveries",
    category: "events",
    read: () =>
      bus.deliveries().map(({ listener, record, error }) => ({
        event: record.event.constructor.name,
        eventId: record.meta.id,
        listener: listener.constructor.name,
        ok: error === undefined,
        ...(error === undefined
          ? {}
          : { error: error instanceof Error ? error.message : String(error) }),
      })),
  });
  return () => {
    removeListeners();
    removeDeliveries();
  };
}

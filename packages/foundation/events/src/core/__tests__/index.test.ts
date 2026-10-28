/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: every value the template imports from `@stackra/events`
 *          (`AnalyticsEvent`, `BroadcastAudience`, `DomainEvent`, `IntegrationEvent`, `Listener`, `WebhookEvent`) and
 *          the registry row's runtime (`Event`, `EventBus`, recording, `registerListeners`, `registerEventNames` and `EVENT_NAMES`, `crossRegionRecords`) are
 *          exported, nothing else is, the `./contracts` symbols are not, and the public types (`ListenerContext`
 *          among them) resolve.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15);
 *                     stackra-223 (a listener's `retry` is the contracts `RetryPolicy`; `ListenerRetry` is gone).
 */
import type { RetryPolicy } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as events from "#core/index";
import type {
  AnalyticsEventOptions,
  BroadcastOptions,
  EventClass,
  IntegrationEventOptions,
  ListenerClass,
  ListenerContext,
  ListenerDelivery,
  ListenerOptions,
  WebhookEventClass,
  WebhookEventOptions,
} from "#core/index";

describe("@stackra/events", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(events).sort()).toEqual([
      "AnalyticsEvent",
      "BroadcastAudience",
      "DomainEvent",
      "EVENT_NAMES",
      "Event",
      "EventBus",
      "IntegrationEvent",
      "Listener",
      "WebhookEvent",
      "crossRegionRecords",
      "recordEvent",
      "registerEventNames",
      "registerListeners",
      "takeRecordedEvents",
    ]);
    expect("EventOutbox" in events).toBe(false);
    expect("RegionBus" in events).toBe(false);
  });

  it("resolves its public types", () => {
    expectTypeOf<AnalyticsEventOptions["name"]>().toEqualTypeOf<string>();
    expectTypeOf<BroadcastOptions["audience"]>().toEqualTypeOf<
      events.BroadcastAudience | undefined
    >();
    expectTypeOf<IntegrationEventOptions["broadcast"]>().toEqualTypeOf<
      BroadcastOptions | undefined
    >();
    expectTypeOf<IntegrationEventOptions["crossRegion"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<ListenerOptions["retry"]>().toEqualTypeOf<RetryPolicy | undefined>();
    expectTypeOf<ListenerContext["now"]>().returns.toEqualTypeOf<Date>();
    expectTypeOf<ListenerDelivery["listener"]>().toEqualTypeOf<events.Listener>();
    expectTypeOf<WebhookEventOptions["type"]>().toEqualTypeOf<string>();
    expectTypeOf(events.IntegrationEvent({ name: "order.paid" })).toEqualTypeOf<EventClass>();
    expectTypeOf(events.Listener({ queue: "default" })).toEqualTypeOf<ListenerClass>();
    expectTypeOf(events.WebhookEvent<{ provider: string }>({ type: "x" })).toEqualTypeOf<
      WebhookEventClass<{ provider: string }>
    >();
  });
});

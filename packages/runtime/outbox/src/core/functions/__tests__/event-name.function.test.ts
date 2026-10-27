/**
 * Stackra file contract:
 * Purpose: unit tests of `eventName`: a registered class gives its locked name; an unregistered integration event gives
 *          its written name with the version and registers it for the inbox; a domain event is refused.
 * Boundary: test only; the registry is cleared before each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0141 (decision 1 and the 2026-10-23 note).
 */
import { DomainEvent, IntegrationEvent } from "@stackra/events";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { EVENT_NAMES } from "#core/constants/event-names.constant";
import { eventName } from "#core/functions/event-name.function";
import { registerEventNames } from "#core/functions/register-event-names.function";

class OrderPaid extends IntegrationEvent({ name: "order.paid" }) {}

class OrderRefunded extends IntegrationEvent({
  name: "order.refunded",
  version: 2,
}) {}

class PointsRedeemed extends DomainEvent {}

describe(eventName, () => {
  beforeEach(() => {
    EVENT_NAMES.byName.clear();
    EVENT_NAMES.names.clear();
  });

  it("gives the locked name gen registered", () => {
    registerEventNames([{ type: OrderPaid, name: "orders.order.paid.v1" }]);
    expect(eventName(OrderPaid)).toBe("orders.order.paid.v1");
  });

  it("falls back to the written name with the version, and registers it", () => {
    expect(eventName(OrderPaid)).toBe("order.paid.v1");
    expect(eventName(OrderRefunded)).toBe("order.refunded.v2");
    expect(EVENT_NAMES.byName.get("order.refunded.v2")).toBe(OrderRefunded);
  });

  it("refuses a domain event", () => {
    expect(() => eventName(PointsRedeemed)).toThrow(/not an integration event/);
  });
});

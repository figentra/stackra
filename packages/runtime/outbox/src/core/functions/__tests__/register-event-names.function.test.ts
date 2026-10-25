/**
 * Stackra file contract:
 * Purpose: unit tests of `registerEventNames`: a row maps an integration event to its locked wire name both ways; a
 *          later row for the class replaces its name; a class that is not an integration event, an empty name and a
 *          name another class holds are refused.
 * Boundary: test only; the registry is cleared before each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0141 (2026-10-23 note); ADR 0294 (decision 20).
 */
import { DomainEvent, IntegrationEvent } from "@stackra/events";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { EVENT_NAMES } from "#core/constants/event-names.constant";
import { registerEventNames } from "#core/functions/register-event-names.function";

class OrderPaid extends IntegrationEvent({ name: "order.paid" }) {}

class OrderShipped extends IntegrationEvent({ name: "order.shipped" }) {}

class PointsRedeemed extends DomainEvent {}

describe(registerEventNames, () => {
  beforeEach(() => {
    EVENT_NAMES.byName.clear();
    EVENT_NAMES.names.clear();
  });

  it("maps an integration event to its wire name both ways", () => {
    registerEventNames([{ type: OrderPaid, name: "orders.order.paid.v1" }]);
    expect(EVENT_NAMES.names.get(OrderPaid)).toBe("orders.order.paid.v1");
    expect(EVENT_NAMES.byName.get("orders.order.paid.v1")).toBe(OrderPaid);
  });

  it("replaces a class's earlier name", () => {
    registerEventNames([{ type: OrderPaid, name: "order.paid.v1" }]);
    registerEventNames([{ type: OrderPaid, name: "orders.order.paid.v1" }]);
    expect(EVENT_NAMES.byName.has("order.paid.v1")).toBe(false);
    expect(EVENT_NAMES.byName.get("orders.order.paid.v1")).toBe(OrderPaid);
  });

  it("refuses a wrong row", () => {
    expect(() =>
      registerEventNames([{ type: PointsRedeemed, name: "points.redeemed.v1" }]),
    ).toThrow(TypeError);
    expect(() => registerEventNames([{ type: OrderPaid, name: "" }])).toThrow(TypeError);
    registerEventNames([{ type: OrderPaid, name: "orders.order.paid.v1" }]);
    expect(() =>
      registerEventNames([{ type: OrderShipped, name: "orders.order.paid.v1" }]),
    ).toThrow(/share the wire name/);
  });
});

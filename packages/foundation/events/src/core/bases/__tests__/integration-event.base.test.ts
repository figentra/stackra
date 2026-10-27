/**
 * Stackra file contract:
 * Purpose: unit and type tests of `IntegrationEvent`: called only; the options are recorded as the
 *          `integration_event` kind with their defaults (version 1, no webhook, principal audience); a bad name,
 *          version, audience or non-boolean `crossRegion` is refused; `crossRegion: true` is recorded; each call
 *          returns its own class, which is an `Event` and builds with `create`.
 * Boundary: test only; registers a zod schema the way gen does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0141 (2026-10-23 note); ADR 0294 (amendment item 7); ADR 0305
 *                     (rule 2); STA-1268.
 */
import { kindOf } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { Event } from "#core/bases/event.base";
import { IntegrationEvent } from "#core/bases/integration-event.base";
import { BroadcastAudience } from "#core/enums/broadcast-audience.enum";
import type { EventClass } from "#core/types/event-class.type";

const ORDER_READ = { verb: "read" };

class OrderPlaced extends IntegrationEvent({ name: "order.placed" }) {
  orderId!: string;
}

class OrderPaid extends IntegrationEvent({
  name: "order.paid",
  version: 2,
  webhook: true,
  broadcast: { permission: ORDER_READ, audience: BroadcastAudience.Scope },
}) {
  orderId!: string;
}

class CatalogueVersionApproved extends IntegrationEvent({
  name: "catalogue_version.approved",
  crossRegion: true,
}) {}

class InboxMessageCreated extends IntegrationEvent({
  name: "inbox_message.created",
  broadcast: { permission: "messages.inbox_message.read" },
}) {}

registerSchemas([[OrderPlaced, z.object({ orderId: z.string() })]]);

describe("IntegrationEvent", () => {
  it("records the options with their defaults", () => {
    expect(kindOf(OrderPlaced)).toEqual({
      kind: "integration_event",
      options: { name: "order.placed", version: 1, webhook: false },
    });
    expect(kindOf(OrderPaid)?.options).toEqual({
      name: "order.paid",
      version: 2,
      webhook: true,
      broadcast: { permission: ORDER_READ, audience: "tenant" },
    });
    expect(kindOf(CatalogueVersionApproved)?.options["crossRegion"]).toBe(true);
    expect(kindOf(InboxMessageCreated)?.options["broadcast"]).toEqual({
      permission: "messages.inbox_message.read",
      audience: "principal",
    });
  });

  it("refuses a name that is not dotted snake_case", () => {
    expect(() => IntegrationEvent({ name: "OrderPaid" })).toThrow(TypeError);
    expect(() => IntegrationEvent({ name: "paid" })).toThrow(TypeError);
    expect(() => IntegrationEvent(undefined as never)).toThrow(TypeError);
  });

  it("refuses a version below 1 or a fraction", () => {
    expect(() => IntegrationEvent({ name: "order.paid", version: 0 })).toThrow(RangeError);
    expect(() => IntegrationEvent({ name: "order.paid", version: 1.5 })).toThrow(RangeError);
  });

  it("refuses an audience outside BroadcastAudience", () => {
    expect(() =>
      IntegrationEvent({
        name: "order.paid",
        broadcast: { permission: "x", audience: "everyone" as BroadcastAudience },
      }),
    ).toThrow(RangeError);
  });

  it("refuses a crossRegion that is not a boolean", () => {
    expect(() => IntegrationEvent({ name: "order.paid", crossRegion: "yes" as never })).toThrow(
      TypeError,
    );
  });

  it("returns its own Event class per call, built with create", () => {
    expect(IntegrationEvent({ name: "a.b" })).not.toBe(IntegrationEvent({ name: "a.b" }));
    const event = OrderPlaced.create({ orderId: "ord_1" });
    expect(event).toBeInstanceOf(OrderPlaced);
    expect(event).toBeInstanceOf(Event);
    expectTypeOf(IntegrationEvent({ name: "a.b" })).toEqualTypeOf<EventClass>();
  });

  it("is called only", () => {
    // @ts-expect-error -- an integration event needs its name
    class Bare extends IntegrationEvent {}
    expect(Bare).toBeTypeOf("function");
  });
});

/**
 * Stackra file contract:
 * Purpose: unit and type tests of `eventRef`: the wire name, payload schema, channel and audience statics, the refused
 *          name, the instance type being the payload, the shape `@stackra/realtime`'s `RealtimeEventRef` reads, and the
 *          runtime side a consumer's inbox needs: an integration event kind whose fallback name is the wire name, built
 *          with `create` through the payload schema.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0141 (wire names); ADR 0225 (broadcast); ADR 0260 (decisions 3 and 4).
 */
import { kindOf } from "@stackra/container";
import { Event } from "@stackra/events";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { z } from "zod";

import { eventRef } from "#core/functions/event-ref.function";

const payload = z.object({ inboxMessageId: z.string(), principalId: z.string() });

class InboxMessageCreated extends eventRef("messages.inbox_message.created.v1", {
  payload,
  channel: "principal.{principalId}.messages",
  audience: "principal",
}) {}

class OrderPaid extends eventRef("orders.order.paid.v1", {
  payload: z.object({ orderId: z.string(), totalMinor: z.number().int() }),
}) {}

describe("eventRef", () => {
  it("carries the wire name, the payload schema, the channel and the audience", () => {
    expect(InboxMessageCreated.eventName).toBe("messages.inbox_message.created.v1");
    expect(InboxMessageCreated.payload).toBe(payload);
    expect(InboxMessageCreated.channel).toBe("principal.{principalId}.messages");
    expect(InboxMessageCreated.audience).toBe("principal");
  });

  it("leaves an undeclared channel and audience absent", () => {
    expect("channel" in OrderPaid).toBe(false);
    expect("audience" in OrderPaid).toBe(false);
  });

  it("refuses a name without a version", () => {
    expect(() => eventRef("orders.order.paid", { payload })).toThrow(RangeError);
  });

  it("is typed by its payload and has the shape a realtime subscription reads", () => {
    expectTypeOf<OrderPaid>().toEqualTypeOf<{ orderId: string; totalMinor: number }>();
    // `@stackra/realtime`'s `RealtimeEventRef`: a static `eventName` and an object prototype.
    expectTypeOf(OrderPaid).toExtend<{
      readonly eventName: string;
      readonly prototype: { orderId: string; totalMinor: number };
    }>();
  });

  it("is an integration event whose written name and version give back the wire name", () => {
    const record = kindOf(OrderPaid);
    expect(record?.kind).toBe("integration_event");
    expect(`${String(record?.options["name"])}.v${String(record?.options["version"])}`).toBe(
      "orders.order.paid.v1",
    );
  });

  it("builds a frozen occurrence of the subclass with create, checked by the payload schema", () => {
    const paid = OrderPaid.create({ orderId: "ord_1", totalMinor: 500 });
    expect(paid).toBeInstanceOf(OrderPaid);
    expect(paid).toBeInstanceOf(Event);
    expect({ ...paid }).toEqual({ orderId: "ord_1", totalMinor: 500 });
    expect(Object.isFrozen(paid)).toBe(true);
    expect(() => OrderPaid.create({ orderId: "ord_1" } as never)).toThrow();
  });
});

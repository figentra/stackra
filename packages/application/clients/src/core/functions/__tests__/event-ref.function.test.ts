/**
 * Stackra file contract:
 * Purpose: unit and type tests of `eventRef`: the wire name, payload schema, channel and audience statics, the refused
 *          name, the instance type being the payload, and the shape `@stackra/realtime`'s `RealtimeEventRef` reads.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0141 (wire names); ADR 0225 (broadcast).
 */
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
});

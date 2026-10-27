/**
 * Stackra file contract:
 * Purpose: unit and type tests of `StateMachine`: the called form records the `state_machine` kind with `field` and
 *          `history`; a transition checks its precondition, runs the body with every argument, writes `to`, returns the
 *          body's value and records `StateTransitioned` after the body's events; a refused, throwing or rejecting
 *          transition leaves the field alone; `can` and `available` ask before acting; bad options, a bare machine, a
 *          missing type argument, a non-state field and an unknown transition name are refused.
 * Boundary: test only; the order machine mirrors the template's `order.state-machine.ts`, and the test registers the
 *           body's event schema the way gen does. Models are built with `new` only to drive the machine.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0161 (0294 note); ADR 0294 (decisions 6 and 16); ADR 0305
 *                     (rules 2, 5 and 44).
 */
import { kindOf } from "@stackra/container";
import { Enum } from "@stackra/contracts";
import { DomainEvent, takeRecordedEvents } from "@stackra/events";
import { HasPublicId, Model } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { StateMachine } from "#core/bases/state-machine.base";
import { Transition } from "#core/decorators/transition.decorator";
import { TransitionNotAllowedError } from "#core/errors/transition-not-allowed.error";
import { StateTransitioned } from "#core/events/state-transitioned.event";

const OrderStatus = Enum.of({
  PendingPayment: "pending_payment",
  Paid: "paid",
  Cancelled: "cancelled",
  Expired: "expired",
});
type OrderStatus = Enum.Value<typeof OrderStatus>;

class OrderPaid extends DomainEvent {
  orderId!: string;

  paymentId!: string;
}

registerSchemas([[OrderPaid, z.object({ orderId: z.string(), paymentId: z.string() })]]);

class Order extends Model.with(HasPublicId("ord")) {
  status: OrderStatus = OrderStatus.PendingPayment;

  paymentId?: string;

  paidAt?: Date;

  note = "";
}

class OrderStateMachine extends StateMachine<Order>({ field: "status" }) {
  @Transition({
    from: OrderStatus.PendingPayment,
    to: OrderStatus.Paid,
  })
  markPaid(order: Order, paymentId: string, capturedAt: Date): string {
    order.paymentId = paymentId;
    order.paidAt = capturedAt;
    order.record(OrderPaid.create({ orderId: order.id, paymentId }));
    return paymentId;
  }

  @Transition({
    from: OrderStatus.PendingPayment,
    to: OrderStatus.Cancelled,
  })
  cancel(order: Order, note: string): void {
    order.note = note;
  }

  @Transition({
    from: [OrderStatus.PendingPayment, OrderStatus.Paid],
    to: OrderStatus.Expired,
  })
  expire(order: Order): void {
    order.note = "expired";
  }

  @Transition({
    from: OrderStatus.PendingPayment,
    to: OrderStatus.Paid,
  })
  decline(_order: Order): void {
    throw new RangeError("declined");
  }

  @Transition({
    from: OrderStatus.PendingPayment,
    to: OrderStatus.Paid,
  })
  async capture(order: Order, paymentId: string): Promise<string> {
    await Promise.resolve();
    order.paymentId = paymentId;
    return paymentId;
  }

  @Transition({
    from: OrderStatus.PendingPayment,
    to: OrderStatus.Paid,
  })
  async captureDeclined(_order: Order): Promise<void> {
    await Promise.resolve();
    throw new RangeError("declined");
  }
}

class SilentOrderStateMachine extends StateMachine<Order>({
  field: "status",
  history: false,
}) {
  @Transition({
    from: OrderStatus.PendingPayment,
    to: OrderStatus.Cancelled,
  })
  cancel(order: Order): void {
    order.note = "cancelled";
  }
}

describe("StateMachine", () => {
  it("records the state_machine kind with field and history", () => {
    expect(kindOf(OrderStateMachine)).toEqual({
      kind: "state_machine",
      options: { field: "status", history: true },
    });
    expect(kindOf(SilentOrderStateMachine)?.options).toEqual({ field: "status", history: false });
    expect(new OrderStateMachine()).toBeInstanceOf(StateMachine);
  });

  it("runs the body with every argument, then writes to and returns the body's value", () => {
    const order = new Order();
    const capturedAt = new Date("2026-10-24T10:00:00Z");
    expect(new OrderStateMachine().markPaid(order, "pay_1", capturedAt)).toBe("pay_1");
    expect(order.status).toBe(OrderStatus.Paid);
    expect(order.paymentId).toBe("pay_1");
    expect(order.paidAt).toBe(capturedAt);
  });

  it("records the body's events, then the history", () => {
    const order = new Order();
    new OrderStateMachine().markPaid(order, "pay_1", new Date());
    const events = takeRecordedEvents(order);
    expect(events.map((event) => event.constructor)).toEqual([OrderPaid, StateTransitioned]);
    expect(events[1]).toEqual({
      machine: "OrderStateMachine",
      transition: "markPaid",
      field: "status",
      from: OrderStatus.PendingPayment,
      to: OrderStatus.Paid,
      recordId: order.id,
    });
  });

  it("records no history when history is false", () => {
    const order = new Order();
    new SilentOrderStateMachine().cancel(order);
    expect(order.status).toBe(OrderStatus.Cancelled);
    expect(takeRecordedEvents(order)).toEqual([]);
  });

  it("refuses a transition from another state without running the body", () => {
    const machine = new OrderStateMachine();
    const order = new Order();
    machine.markPaid(order, "pay_1", new Date());
    takeRecordedEvents(order);
    expect(() => machine.cancel(order, "too late")).toThrow(TransitionNotAllowedError);
    const refusal = (() => {
      try {
        machine.markPaid(order, "pay_2", new Date());
      } catch (error) {
        return error;
      }
      return undefined;
    })();
    expect(refusal).toBeInstanceOf(TransitionNotAllowedError);
    expect((refusal as TransitionNotAllowedError).toEnvelope().details).toEqual({
      transition: "markPaid",
      state: OrderStatus.Paid,
    });
    expect(order.note).toBe("");
    expect(order.paymentId).toBe("pay_1");
    expect(order.status).toBe(OrderStatus.Paid);
    expect(takeRecordedEvents(order)).toEqual([]);
  });

  it("runs from any of several from states", () => {
    const machine = new OrderStateMachine();
    const pending = new Order();
    machine.expire(pending);
    expect(pending.status).toBe(OrderStatus.Expired);
    const paid = new Order();
    machine.markPaid(paid, "pay_1", new Date());
    machine.expire(paid);
    expect(paid.status).toBe(OrderStatus.Expired);
  });

  it("leaves the field alone when the body throws", () => {
    const order = new Order();
    expect(() => new OrderStateMachine().decline(order)).toThrow(RangeError);
    expect(order.status).toBe(OrderStatus.PendingPayment);
    expect(takeRecordedEvents(order)).toEqual([]);
  });

  it("writes after an async body resolves, and not when it rejects", async () => {
    const machine = new OrderStateMachine();
    const order = new Order();
    const captured = machine.capture(order, "pay_1");
    expect(order.status).toBe(OrderStatus.PendingPayment);
    await expect(captured).resolves.toBe("pay_1");
    expect(order.status).toBe(OrderStatus.Paid);
    const declined = new Order();
    await expect(machine.captureDeclined(declined)).rejects.toThrow(RangeError);
    expect(declined.status).toBe(OrderStatus.PendingPayment);
  });

  it("answers can and available from the record's state", () => {
    const machine = new OrderStateMachine();
    const order = new Order();
    expect(machine.can(order, "cancel")).toBe(true);
    expect(machine.available(order)).toEqual([
      "markPaid",
      "cancel",
      "expire",
      "decline",
      "capture",
      "captureDeclined",
    ]);
    machine.markPaid(order, "pay_1", new Date());
    expect(machine.can(order, "cancel")).toBe(false);
    expect(machine.available(order)).toEqual(["expire"]);
  });

  it("refuses bad options and a machine built without them", () => {
    expect(() => StateMachine<Order>({ field: "" as "status" })).toThrow(TypeError);
    expect(() => StateMachine<Order>({ field: "status", history: "yes" as never })).toThrow(
      TypeError,
    );
    expect(() => StateMachine(undefined as never)).toThrow(TypeError);
    const Bare = StateMachine as unknown as abstract new () => object;
    class BareMachine extends Bare {}
    expect(() => new BareMachine()).toThrow(TypeError);
  });

  it("types the options and the transition names from the model", () => {
    // @ts-expect-error -- the called form needs the model as a type argument
    const Untyped = StateMachine({ field: "status" });
    // @ts-expect-error -- `note` is a plain string, not a closed set of states
    const OnNote = StateMachine<Order>({ field: "note" });
    // @ts-expect-error -- `id` is a public id, not a closed set of states
    const OnId = StateMachine<Order>({ field: "id" });
    const machine = new OrderStateMachine();
    const order = new Order();
    // @ts-expect-error -- the machine has no `refund` transition
    expect(machine.can(order, "refund")).toBe(false);
    // @ts-expect-error -- the base's own members are not transitions
    expect(machine.can(order, "available")).toBe(false);
    expect([Untyped, OnNote, OnId]).toHaveLength(3);
  });
});

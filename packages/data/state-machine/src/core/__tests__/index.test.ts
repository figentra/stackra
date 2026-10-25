/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: `StateMachine` and `Transition`, the symbols the template imports,
 *          plus `TransitionNotAllowedError` and `StateTransitioned`, are exported and nothing else is; the public types
 *          resolve; and the template's order and product machines, with the `can(...)` calls of its policy, facts,
 *          service and archive action, compile and run against the entry.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias. The machines copy the template's
 *           `order.state-machine.ts` and `product.state-machine.ts` declarations, with local stand-ins for their
 *           models, enums and events.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { Enum } from "@stackra/contracts";
import { DomainEvent, takeRecordedEvents } from "@stackra/events";
import { HasPublicId, Model } from "@stackra/model";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

import * as stateMachine from "#core/index";
import { StateMachine, StateTransitioned, Transition } from "#core/index";
import type {
  StateField,
  StateMachineBase,
  StateMachineOptions,
  TransitionName,
  TransitionOptions,
} from "#core/index";

const OrderStatus = Enum.of({
  PendingPayment: "pending_payment",
  Paid: "paid",
  Cancelled: "cancelled",
  Expired: "expired",
});
type OrderStatus = Enum.Value<typeof OrderStatus>;

const CancelReason = Enum.of({ Customer: "customer", Expired: "expired" });
type CancelReason = Enum.Value<typeof CancelReason>;

const ProductStatus = Enum.of({ Draft: "draft", Active: "active", Archived: "archived" });
type ProductStatus = Enum.Value<typeof ProductStatus>;

class OrderPaid extends DomainEvent {
  orderId!: string;

  paymentId!: string;
}

class OrderCancelled extends DomainEvent {
  orderId!: string;

  reason!: CancelReason;
}

class ProductArchived extends DomainEvent {
  productId!: string;
}

registerSchemas([
  [OrderPaid, z.object({ orderId: z.string(), paymentId: z.string() })],
  [OrderCancelled, z.object({ orderId: z.string(), reason: z.enum(["customer", "expired"]) })],
  [ProductArchived, z.object({ productId: z.string() })],
]);

class Order extends Model.with(HasPublicId("ord")) {
  status: OrderStatus = OrderStatus.PendingPayment;

  customerId = "usr_1";

  paymentId?: string;

  paidAt?: Date;
}

class Product extends Model.with(HasPublicId("prd")) {
  status: ProductStatus = ProductStatus.Draft;
}

class OrderStateMachine extends StateMachine<Order>({ field: "status" }) {
  @Transition({
    from: OrderStatus.PendingPayment,
    to: OrderStatus.Paid,
  })
  markPaid(order: Order, paymentId: string, capturedAt: Date): void {
    order.paymentId = paymentId;
    order.paidAt = capturedAt;
    order.record(OrderPaid.create({ orderId: order.id, paymentId }));
  }

  @Transition({
    from: OrderStatus.PendingPayment,
    to: OrderStatus.Cancelled,
  })
  cancel(order: Order, reason: CancelReason): void {
    order.record(OrderCancelled.create({ orderId: order.id, reason }));
  }

  @Transition({
    from: OrderStatus.PendingPayment,
    to: OrderStatus.Expired,
  })
  expire(order: Order): void {
    order.record(OrderCancelled.create({ orderId: order.id, reason: CancelReason.Expired }));
  }
}

class ProductStateMachine extends StateMachine<Product>({ field: "status" }) {
  @Transition({
    from: ProductStatus.Draft,
    to: ProductStatus.Active,
  })
  activate(_product: Product): void {
    // storefront reads pick the product up by its status, so there is no event to record
  }

  @Transition({
    from: ProductStatus.Active,
    to: ProductStatus.Archived,
  })
  archive(product: Product): void {
    product.record(ProductArchived.create({ productId: product.id }));
  }
}

/** The template's `OrderService` shape: the machine injected through the constructor. */
class OrderService {
  readonly lifecycle: OrderStateMachine;

  constructor(lifecycle: OrderStateMachine) {
    this.lifecycle = lifecycle;
  }

  capture(order: Order, paymentId: string, capturedAt: Date): boolean {
    if (this.lifecycle.can(order, "markPaid")) {
      this.lifecycle.markPaid(order, paymentId, capturedAt);
      return true;
    }
    return false;
  }

  cancel(order: Order, reason: CancelReason): void {
    if (reason === CancelReason.Expired) {
      if (this.lifecycle.can(order, "expire")) this.lifecycle.expire(order);
      return;
    }
    if (this.lifecycle.can(order, "cancel")) this.lifecycle.cancel(order, reason);
  }
}

describe("@stackra/state-machine", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(stateMachine).sort()).toEqual([
      "StateMachine",
      "StateTransitioned",
      "Transition",
      "TransitionNotAllowedError",
    ]);
    expect("StateMachineBase" in stateMachine).toBe(false);
    expect("STATE_TRANSITIONED_SCHEMA" in stateMachine).toBe(false);
  });

  it("resolves its public types", () => {
    expectTypeOf<StateField<Order>>().toEqualTypeOf<"status">();
    expectTypeOf<StateMachineOptions<Order>["field"]>().toEqualTypeOf<"status">();
    expectTypeOf<StateMachineOptions<Order>["history"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<TransitionOptions["from"]>().toEqualTypeOf<string | readonly string[]>();
    expectTypeOf<TransitionOptions["to"]>().toEqualTypeOf<string>();
    expectTypeOf<TransitionName<OrderStateMachine, Order>>().toEqualTypeOf<
      "markPaid" | "cancel" | "expire"
    >();
    const machine: StateMachineBase<Order> = new OrderStateMachine();
    expect(machine).toBeInstanceOf(StateMachine);
  });

  it("runs the template's order machine through its service", () => {
    const service = new OrderService(new OrderStateMachine());
    const paid = new Order();
    expect(service.capture(paid, "pay_1", new Date())).toBe(true);
    expect(service.capture(paid, "pay_2", new Date())).toBe(false);
    expect(paid.status).toBe(OrderStatus.Paid);
    expect(takeRecordedEvents(paid).map((event) => event.constructor)).toEqual([
      OrderPaid,
      StateTransitioned,
    ]);
    const expired = new Order();
    service.cancel(expired, CancelReason.Expired);
    expect(expired.status).toBe(OrderStatus.Expired);
    service.cancel(paid, CancelReason.Customer);
    expect(paid.status).toBe(OrderStatus.Paid);
  });

  it("runs the template's product machine as its archive action does", () => {
    const lifecycle = new ProductStateMachine();
    const product = new Product();
    if (lifecycle.can(product, "archive")) lifecycle.archive(product);
    expect(product.status).toBe(ProductStatus.Draft);
    lifecycle.activate(product);
    if (lifecycle.can(product, "archive")) lifecycle.archive(product);
    expect(product.status).toBe(ProductStatus.Archived);
    expect(lifecycle.available(product)).toEqual([]);
    expectTypeOf(lifecycle.available(product)).toEqualTypeOf<("activate" | "archive")[]>();
  });
});

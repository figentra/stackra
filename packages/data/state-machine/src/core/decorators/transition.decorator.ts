/**
 * Stackra file contract:
 * Purpose: `@Transition({ from, to })`, the method decorator that makes a method of a state machine one of its
 *          transitions: `from` is its precondition and `to` the state it writes.
 * Boundary: made with `createDecorator`, so it records its options and nothing else; the `StateMachine` base reads them
 *           when the machine is constructed and wraps each method (ADR 0294 decision 6: decorators record, the kind
 *           acts). On a field, or on a class that is not a state machine, it throws a TypeError at class definition.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 6 and 23: one of the two method decorators, beside `@Step`); ADR 0161 (0294
 *                     note); ADR 0005 (legacy decorators).
 */
import { createDecorator, DecoratorTarget } from "@stackra/container";

import type { TransitionOptions } from "#core/types/transition-options.type";

/**
 * The transition decorator.
 *
 * @example
 * export class OrderStateMachine extends StateMachine<Order>({ field: "status" }) {
 *   @Transition({ from: OrderStatus.PendingPayment, to: OrderStatus.Cancelled })
 *   cancel(order: Order, reason: CancelReason): void {
 *     order.record(OrderCancelled.create({ orderId: order.id, customerId: order.customerId, reason }));
 *   }
 * }
 */
export const Transition = createDecorator<TransitionOptions>({
  kind: "transition",
  target: DecoratorTarget.Method,
  kinds: ["state_machine"],
});

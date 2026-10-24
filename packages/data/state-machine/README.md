# @stackra/state-machine

The lifecycle of one model field (ADR 0161 with its 0294 note, ADR 0305 rule 5). A machine is a class that extends
`StateMachine<Order>({ field: "status" })`; each method marked `@Transition({ from, to })` is a transition the caller
invokes directly. No XState (ADR 0227).

**Tier:** `tier:lib` (`packages/data/state-machine`). Entry `.` only. Depends on `@stackra/container`,
`@stackra/contracts`, `@stackra/errors`, `@stackra/events`, `@stackra/model` and `@stackra/validation`.

## What is here

| Symbol                                                                                         | Use                                                                         |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `StateMachine`                                                                                 | the kind base, called with the model as type argument: `{ field, history }` |
| `Transition`                                                                                   | the method decorator: `from` (the precondition) and `to`                    |
| `TransitionNotAllowedError`                                                                    | a transition called from a state it does not start from (409)               |
| `StateTransitioned`                                                                            | the history entry each transition records on the record (a domain event)    |
| `StateMachineOptions`, `TransitionOptions`, `TransitionName`, `StateField`, `StateMachineBase` | types                                                                       |

## A machine

```ts
import { StateMachine, Transition } from "@stackra/state-machine";

export class OrderStateMachine extends StateMachine<Order>({ field: "status" }) {
  @Transition({ from: OrderStatus.PendingPayment, to: OrderStatus.Paid })
  markPaid(order: Order, paymentId: string, capturedAt: Date): void {
    order.paymentId = paymentId;
    order.paidAt = capturedAt;
    order.record(OrderPaid.create({ orderId: order.id, paymentId }));
  }

  @Transition({ from: OrderStatus.PendingPayment, to: OrderStatus.Cancelled })
  cancel(order: Order, reason: CancelReason): void {
    order.record(OrderCancelled.create({ orderId: order.id, reason }));
  }
}
```

The states are the codes of the field's enum, and the initial state is the field's initializer on the model. `field`
accepts only a field typed as a closed set of codes, so a plain `string` or a `PublicId` is refused by the compiler.

## Calling a transition

The machine is a binding: inject it and call the method.

```ts
if (this.lifecycle.can(order, "cancel")) this.lifecycle.cancel(order, reason);
this.lifecycle.available(order); // ["markPaid", "cancel"] while the order is pending
```

A call checks the precondition (the record is in a `from` state, or it throws `TransitionNotAllowedError` before the
body runs), runs the body, writes `to`, and records a `StateTransitioned` event after the body's own events. All of it
runs in the caller's call, so it shares the caller's unit of work: a rolled-back change records nothing. A body that
throws leaves the field unchanged; an async body's write waits for it to resolve. `history: false` turns the
`StateTransitioned` event off; the body's own events are still recorded.

## Not here

- The permission of a transition: it is the permission of the action that calls it (ADR 0161, 0294 note).
- Timed transitions (the scheduler) and tenant customisation (ADR 0161 decisions 5 and 6).
- The `state-field-write` lint and gen's state checks (a state outside the enum, an unreachable state), STA-340.
- Persisting the history: the audit log's listener handles `StateTransitioned`.

/**
 * Stackra file contract:
 * Purpose: `StateMachine<M>({ field, history })`, the kind base of a model field's lifecycle class: each method marked
 *          `@Transition({ from, to })` is a transition the caller invokes directly (`this.lifecycle.cancel(order)`).
 *          A transition checks its precondition (the record is in a `from` state), runs the body, writes `to` and
 *          records the history; inherited `can(record, name)` and `available(record)` ask before acting.
 * Boundary: called only, with the model as the type argument (gone at runtime: gen reads it); a called form without
 *           it fails with a readable hint (`WithPartner`). A binding with constructor dependencies, registered as the
 *           `state_machine` kind. The decorator records only; this base wraps each transition on the instance when the
 *           machine is constructed, so a call through the prototype skips the check. The check, the body and the write
 *           run in the caller's call and so in its unit of work; an async body's write waits for it to resolve, and a
 *           body that throws or rejects leaves the field unchanged. The history is a `StateTransitioned` domain event
 *           recorded on the record after the body's own events. `StateMachineBase` (its own file) is the instance
 *           base; the entry exports it as a type only, so no machine skips its options.
 * Runtime: isomorphic
 * Governing contract: ADR 0161 (0294 note: methods are transitions, "guard" reads "precondition"); ADR 0294
 *                     (decisions 6, 16, 23 and 25); ADR 0305 (rules 2, 5 and 44); ADR 0227 (no XState).
 */
import { createKind, type WithPartner } from "@stackra/container";
import type { Model } from "@stackra/model";

import { StateMachineBase } from "#core/bases/state-machine-base.base";
import type { StateMachineOptions } from "#core/types/state-machine-options.type";

/** What a called form without its type argument fails with. */
type Hint = "Name the model as a type argument: StateMachine<Order>({ field })";

/** The one called form. */
type StateMachineKind = <M extends Model = never>(
  options: WithPartner<M, StateMachineOptions<M>, Hint>,
) => abstract new () => StateMachineBase<M>;

/** Checks the options and records exactly `field` and `history`. */
function read(options?: { readonly field?: unknown; readonly history?: unknown }) {
  const field = options?.field;
  if (typeof field !== "string" || field === "")
    throw new TypeError(
      `StateMachine({ field }) names the model field the machine governs, got ${JSON.stringify(field)}`,
    );
  const history = options?.history ?? true;
  if (typeof history !== "boolean")
    throw new TypeError(
      `StateMachine({ history }) is true or false, got ${JSON.stringify(history)}`,
    );
  return { field, history };
}

/**
 * The state machine kind base.
 *
 * @example
 * export class OrderStateMachine extends StateMachine<Order>({ field: "status" }) {
 *   @Transition({ from: OrderStatus.PendingPayment, to: OrderStatus.Cancelled })
 *   cancel(order: Order, reason: CancelReason): void {
 *     order.record(OrderCancelled.create({ orderId: order.id, customerId: order.customerId, reason }));
 *   }
 * }
 */
export const StateMachine = createKind("state_machine", StateMachineBase, read) as StateMachineKind;

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
 *           recorded on the record after the body's own events. `StateMachineBase` is the instance base; the entry
 *           exports it as a type only, so no machine skips its options.
 * Runtime: isomorphic
 * Governing contract: ADR 0161 (0294 note: methods are transitions, "guard" reads "precondition"); ADR 0294
 *                     (decisions 6, 16, 23 and 25); ADR 0305 (rules 2, 5 and 44); ADR 0227 (no XState).
 */
import { createKind, kindOf, type AnyClass, type WithPartner } from "@stackra/container";
import type { Model } from "@stackra/model";

import { Transition } from "#core/decorators/transition.decorator";
import { TransitionNotAllowedError } from "#core/errors/transition-not-allowed.error";
import { StateTransitioned } from "#core/events/state-transitioned.event";
import type { StateMachineOptions } from "#core/types/state-machine-options.type";
import type { TransitionName } from "#core/types/transition-name.type";
import type { TransitionOptions } from "#core/types/transition-options.type";

/** The options the kind registry holds for a machine, after `read`. */
interface MachineOptions {
  readonly field: string;
  readonly history: boolean;
}

/** A model read by field name. */
type Fields = Model & Record<string, unknown>;

/** The recorded options of machine class `type`. */
function optionsOf(type: object): MachineOptions {
  const options = kindOf(type)?.options as Partial<MachineOptions> | undefined;
  if (typeof options?.field !== "string")
    throw new TypeError(
      `${(type as { name?: string }).name || "A state machine"} must extend StateMachine<Model>({ field })`,
    );
  return options as MachineOptions;
}

/** Whether `state` is one the transition starts from: its precondition. */
function startsFrom(transition: TransitionOptions, state: unknown): boolean {
  return [transition.from].flat().includes(state as string);
}

/** Wraps `body` as the transition `name` of `machine`. */
function transitionOf(
  machine: object,
  name: string | symbol,
  transition: TransitionOptions,
  { field, history }: MachineOptions,
  body: (...args: unknown[]) => unknown,
): (record: Model, ...args: unknown[]) => unknown {
  const settle = (record: Fields, from: string): void => {
    record[field] = transition.to;
    if (!history) return;
    const id = record["id"];
    record.record(
      StateTransitioned.create({
        machine: machine.constructor.name,
        transition: String(name),
        field,
        from,
        to: transition.to,
        ...(typeof id === "string" ? { recordId: id } : {}),
      }),
    );
  };
  return (record, ...args) => {
    const from = (record as Fields)[field];
    if (!startsFrom(transition, from))
      throw TransitionNotAllowedError.create({ transition: String(name), state: String(from) });
    const result = body.apply(machine, [record, ...args]);
    if (result instanceof Promise)
      return result.then((value: unknown) => {
        settle(record as Fields, from as string);
        return value;
      });
    settle(record as Fields, from as string);
    return result;
  };
}

/** The instance side every machine shares: `can` and `available`, and its transitions wrapped at construction. */
export abstract class StateMachineBase<M extends Model> {
  /** Type-only kind brand, so a class of another kind cannot stand in for a state machine. */
  declare protected readonly "~kind": "state_machine";

  constructor() {
    const options = optionsOf(new.target);
    for (const [name, transition] of Transition.members(new.target)) {
      const body = Reflect.get(this, name) as (...args: unknown[]) => unknown;
      Object.defineProperty(this, name, {
        value: transitionOf(this, name, transition, options, body),
        configurable: true,
        writable: true,
      });
    }
  }

  /**
   * Whether the transition `name` may run on `record` now.
   *
   * @example
   * if (this.lifecycle.can(order, "cancel")) this.lifecycle.cancel(order, reason);
   */
  can(record: M, name: TransitionName<this, M>): boolean {
    const transition = Transition.members(this.constructor as AnyClass).get(name);
    const state = (record as Fields)[optionsOf(this.constructor).field];
    return transition !== undefined && startsFrom(transition, state);
  }

  /**
   * The transitions that may run on `record` now, in declaration order.
   *
   * @example
   * this.lifecycle.available(order); // ["markPaid", "cancel", "expire"] for a pending order
   */
  available<T extends this>(this: T, record: M): TransitionName<T, M>[] {
    const state = (record as Fields)[optionsOf(this.constructor).field];
    const names: TransitionName<T, M>[] = [];
    for (const [name, transition] of Transition.members(this.constructor as AnyClass))
      if (typeof name === "string" && startsFrom(transition, state))
        names.push(name as TransitionName<T, M>);
    return names;
  }
}

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

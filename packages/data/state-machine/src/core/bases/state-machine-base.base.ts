/**
 * Stackra file contract:
 * Purpose: `StateMachineBase<M>`, the instance side every `StateMachine<M>({ field, history })` class shares: it wraps
 *          each `@Transition` method on the instance at construction (precondition, body, write of `to`, history
 *          event) and answers `can(record, name)` and `available(record)`.
 * Boundary: never extended directly: `StateMachine<M>(...)` (state-machine.base.ts) records the options this base reads
 *           from the kind registry, and the entry exports it as a type only. A call through the prototype skips the
 *           check. An async body's write waits for it to resolve; a body that throws or rejects leaves the field
 *           unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0161 (0294 note: methods are transitions, "guard" reads "precondition"); ADR 0294
 *                     (decisions 6, 16, 23 and 25); ADR 0305 (rules 2, 5, 10 to 13 and 44).
 */
import { kindOf, type AnyClass } from "@stackra/container";
import type { Model } from "@stackra/model";

import { Transition } from "#core/decorators/transition.decorator";
import { TransitionNotAllowedError } from "#core/errors/transition-not-allowed.error";
import { StateTransitioned } from "#core/events/state-transitioned.event";
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

/**
 * Stackra file contract:
 * Purpose: `TransitionName<T, M>`, the transition names of machine class `T` over model `M`: the methods `T` adds to
 *          the base that take the record first. It types the name in `can(order, "cancel")` and `available(order)`.
 * Boundary: a type only. The base's own members (`can`, `available`) are left out. A helper method that also takes the
 *           record first is a name too; `can` answers false for it at runtime.
 * Runtime: isomorphic
 * Governing contract: ADR 0161 (0294 note: the caller invokes a transition directly); ADR 0294 (decision 6).
 */
import type { Model } from "@stackra/model";

import type { StateMachineBase } from "#core/bases/state-machine-base.base";

/** The members of `T` beyond the machine base. */
type Own<T, M extends Model> = Exclude<keyof T, keyof StateMachineBase<M>>;

/**
 * The transition names of `T`.
 *
 * @example
 * type N = TransitionName<OrderStateMachine, Order>; // "markPaid" | "cancel" | "expire"
 */
export type TransitionName<T, M extends Model> = {
  [K in Own<T, M>]: T[K] extends (record: M, ...args: never[]) => unknown ? K : never;
}[Own<T, M>] &
  string;

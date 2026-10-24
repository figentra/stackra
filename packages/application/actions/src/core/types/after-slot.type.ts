/**
 * Stackra file contract:
 * Purpose: `AfterSlot<V, A>`, the type of an `after` slot of an extension point: the owner calls it with the value it
 *          computed, its arguments and its context, and gets back the value every extension adjusted in turn.
 * Boundary: a type only; `ExtensionPoint.after<V, A>()` makes the callable. The `~slot` brand tells it from a `before`
 *           slot, which `SlotHandler` reads to type an extension's `handle`.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 23 and 25); ADR 0265 as amended (the transform point is `after`).
 */
import type { ExtensionContext } from "#core/types/extension-context.type";

/** A value pipeline: each extension receives the previous result and returns the adjusted value, in `order`. */
export interface AfterSlot<V, A extends readonly unknown[]> {
  /** Runs every extension of the slot in ascending `order` and resolves to the last result (`value` when none). */
  (value: V, ...args: [...A, ctx: ExtensionContext]): Promise<V>;

  /** The slot kind. */
  readonly "~slot": "after";
}

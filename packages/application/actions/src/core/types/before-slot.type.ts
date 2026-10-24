/**
 * Stackra file contract:
 * Purpose: `BeforeSlot<A>`, the type of a `before` slot of an extension point: the owner calls it with its arguments
 *          and its context before its own step; an extension refuses by throwing a Refusal or returns replacement
 *          arguments of the same type.
 * Boundary: a type only; `ExtensionPoint.before<A>()` makes the callable. The `~slot` brand tells it from an `after`
 *           slot.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 23 and 25); ADR 0265 as amended (the verify point is `before`, and may return
 *                     replacement arguments).
 */
import type { ExtensionContext } from "#core/types/extension-context.type";

/** A check ahead of the owner's step: refuse by throwing, or pass on (possibly replaced) arguments, in `order`. */
export interface BeforeSlot<A extends readonly unknown[]> {
  /** Runs every extension of the slot in ascending `order` and resolves to the final arguments. */
  (...args: [...A, ctx: ExtensionContext]): Promise<A>;

  /** The slot kind. */
  readonly "~slot": "before";
}

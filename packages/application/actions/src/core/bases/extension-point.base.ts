/**
 * Stackra file contract:
 * Purpose: `ExtensionPoint`, the kind base of the seams a module publishes for other modules: `extends ExtensionPoint`
 *          with one property per slot, `ExtensionPoint.after<V, A>()` (a value pipeline) or
 *          `ExtensionPoint.before<A>()` (a check ahead of the owner's step). The owner injects its point and calls each
 *          slot as a method, so every call site is greppable.
 * Boundary: bare only. A point is part of its module's contract, like an event; it never imports its extensions, which
 *           find it through their type argument (gen) and `registerExtensions` (runtime). It has no `around` slot: a
 *           whole-call wrapper is an Interceptor. A slot's key is `<module>.<property>`, locked like any identity.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 22 to 25 and 27); ADR 0265 as amended (decisions 1, 4, 6 and 8); ADR 0294
 *                     (decision 23: extension point and extension).
 */
import { registerKind } from "@stackra/container";

import { createSlot } from "#core/functions/create-slot.function";
import type { AfterSlot } from "#core/types/after-slot.type";
import type { BeforeSlot } from "#core/types/before-slot.type";

/**
 * The extension point kind base.
 *
 * @example
 * export class OrderExtensionPoint extends ExtensionPoint {
 *   readonly adjustTotals = ExtensionPoint.after<OrderTotals, [draft: OrderDraft]>();
 *
 *   readonly verifyPlacement = ExtensionPoint.before<[draft: OrderDraft]>();
 * }
 *
 * // the owner, with the point injected
 * const adjusted = await this.extensions.adjustTotals(base, draft, ctx);
 */
export abstract class ExtensionPoint {
  /** Type-only kind brand, so a class of another kind cannot stand in for a point. */
  declare readonly "~kind": "extension_point";

  /**
   * An `after` slot: runs after the owner computed a value of type `V`; each extension receives the previous result
   * and the slot's arguments `A`, and returns the adjusted value, in ascending `order`.
   */
  static after<V, A extends readonly unknown[] = []>(): AfterSlot<V, A> {
    return createSlot("after") as unknown as AfterSlot<V, A>;
  }

  /**
   * A `before` slot: runs before the owner's step with the arguments `A`, in ascending `order`; an extension refuses
   * by throwing a Refusal, or returns replacement arguments of the same type.
   */
  static before<A extends readonly unknown[]>(): BeforeSlot<A> {
    return createSlot("before") as unknown as BeforeSlot<A>;
  }
}

registerKind(ExtensionPoint, "extension_point");

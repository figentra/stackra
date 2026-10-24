/**
 * Stackra file contract:
 * Purpose: `AnySlot`, the constraint of an extension's type argument: any `after` or `before` slot of any point, told
 *          apart by its `~slot` brand.
 * Boundary: a type only, written structurally so every `AfterSlot<V, A>` and `BeforeSlot<A>` satisfies it whatever its
 *           value and argument types; a type argument that is not a slot is a compile error.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 25: `Extension<Point["slot"]>`).
 */

/** Any slot of any extension point. */
export interface AnySlot {
  /** The slot kind. */
  readonly "~slot": "after" | "before";
}

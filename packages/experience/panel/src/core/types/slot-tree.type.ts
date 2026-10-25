/**
 * Stackra file contract:
 * Purpose: `SlotTree<D>`, what `slots(definition)` returns for its definition: the same tree with every slot name a
 *          `SlotRef`.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 18).
 */
import type { SlotRef } from "#core/types/slot-ref.type";

/** The slot refs of definition `D`. */
export type SlotTree<D> = {
  readonly [K in keyof D]: D[K] extends readonly (infer N extends string)[]
    ? { readonly [P in N]: SlotRef }
    : D[K] extends string
      ? SlotRef
      : SlotTree<D[K]>;
};

/**
 * Stackra file contract:
 * Purpose: `ResolvedSlot`, the slot a fill names once `slotOf` found it: its key, surface, cardinality and props record,
 *          from the member's own `SlotIR` or a dependency manifest's `slots` entry.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0438; ADR 0260 (a dependency is read from its manifest).
 */

/** A resolved slot. */
export interface ResolvedSlot {
  /** The snake_case dotted key. */
  readonly key: string;

  /** The surface code. */
  readonly surface: string;

  /** `one` or `many`. */
  readonly cardinality: string;

  /** Prop name (`name?` when optional) to its type text. */
  readonly props: Readonly<Record<string, string>>;
}

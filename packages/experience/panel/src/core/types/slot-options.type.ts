/**
 * Stackra file contract:
 * Purpose: `SlotOptions`, what a shell writes in `defineSlot<Props>({ ... })`: the slot key, the surface it sits on and
 *          how many fills it takes.
 * Boundary: a type only. The values are static data gen reads from the syntax tree (`slot_options_not_constant`
 *           otherwise); the props type is the type argument, never an option.
 * Runtime: isomorphic
 * Governing contract: ADR 0438; app-shells-edge-and-extension.md sections 2 (surfaces) and 7.2.
 */
import type { SlotCardinality } from "#core/types/slot-cardinality.type";

/** The options of `defineSlot`. */
export interface SlotOptions {
  /** The snake_case dotted key, at least two segments (`auth.sign_in.brand_panel`). */
  readonly key: string;

  /** The surface code the slot sits on (`console`, `ops`, `landing`, `mobile`, `till`, `shopper`, `kiosk`). */
  readonly surface: string;

  /** How many fills it takes; `one` when left out. */
  readonly cardinality?: SlotCardinality;
}

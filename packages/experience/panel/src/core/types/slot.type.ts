/**
 * Stackra file contract:
 * Purpose: `Slot<P>`, a shell slot as `defineSlot<P>(...)` declares it: a named, typed place in a shell (OS console,
 *          ops, landing, mobile) that a product fills with its own component of props `P`, instead of shadowing shell
 *          files.
 * Boundary: a type only. `props` is type-only (never set at run time): it makes `Slot<A>` and `Slot<B>` differ, so
 *           `fillSlot` checks a fill's component against `P`, and gen reads it into the manifest's `props` record.
 *           Distinct from `SlotRef`, a widget place inside a panel (ADR 0307 rule 18).
 * Runtime: isomorphic
 * Governing contract: ADR 0438 (shells are changed through slots); ADR 0350 (slots in app screens); ADR 0306 (shadows
 *                     stay for a member's own compiled code); app-shells-edge-and-extension.md 7.1 to 7.3.
 */
import type { SlotCardinality } from "#core/types/slot-cardinality.type";

/** A shell slot with props `P`. */
export interface Slot<P extends object = object> {
  /** The snake_case dotted key (`auth.sign_in.brand_panel`), locked once a fill names it. */
  readonly key: string;

  /** The surface code the slot sits on (`console`). */
  readonly surface: string;

  /** How many fills it takes. */
  readonly cardinality: SlotCardinality;

  /** Type only: the props a fill's component takes. Never present at run time. */
  readonly props?: P;
}

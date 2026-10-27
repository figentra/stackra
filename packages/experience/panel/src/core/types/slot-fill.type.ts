/**
 * Stackra file contract:
 * Purpose: `SlotFill<P>`, what `fillSlot(slot, component, { surface })` returns: one product component bound to one
 *          shell slot on one surface.
 * Boundary: a type only. Gen lists each fill in the manifest (`fills`) for the OS registry; the shell draws it on the
 *           product's hosts. A fill changes presentation only, never the flow behind it.
 * Runtime: isomorphic
 * Governing contract: ADR 0438; app-shells-edge-and-extension.md 7.2 (points 2 to 5).
 */
import type { Slot } from "#core/types/slot.type";
import type { SlotComponent } from "#core/types/slot-component.type";

/** One component bound to one slot. */
export interface SlotFill<P extends object = object> {
  /** The slot it fills. */
  readonly slot: Slot<P>;

  /** The component drawn in the slot. */
  readonly component: SlotComponent<P>;

  /** The surface the fill's bundle is built for; equal to the slot's. */
  readonly surface: string;
}

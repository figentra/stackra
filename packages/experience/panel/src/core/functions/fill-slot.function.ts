/**
 * Stackra file contract:
 * Purpose: `fillSlot(slot, component, { surface })`, how a product's UI package fills a shell slot with its own
 *          component. TypeScript checks the component against the slot's props type; gen reads every exported
 *          `fillSlot` call into the manifest's `fills` and refuses one whose slot is undeclared (`slot_undeclared`),
 *          whose surface differs (`slot_surface_mismatch`) or whose props differ from the shell's committed manifest
 *          (`slot_props_mismatch`).
 * Boundary: pure; returns a frozen object. Write it as `export const X = fillSlot(Slot, Component, { surface })` with
 *           the slot imported from the shell package and a static surface. A fill changes presentation only.
 * Runtime: isomorphic
 * Governing contract: ADR 0438; app-shells-edge-and-extension.md 7.2 (points 2 to 5) and 12.2.1.
 */
import type { Slot } from "#core/types/slot.type";
import type { SlotComponent } from "#core/types/slot-component.type";
import type { SlotFill } from "#core/types/slot-fill.type";

/**
 * The fill of `slot` with `component` on `options.surface`.
 *
 * @throws RangeError when the surface is not the slot's.
 * @example
 * export const MezzoraBrandPanel = fillSlot(SignInBrandPanel, BrandPanel, { surface: "console" });
 */
export function fillSlot<P extends object>(
  slot: Slot<P>,
  component: SlotComponent<P>,
  options: { readonly surface: string },
): SlotFill<P> {
  if (options.surface !== slot.surface)
    throw new RangeError(
      `fillSlot: "${slot.key}" sits on the ${slot.surface} surface, not ${options.surface}`,
    );
  return Object.freeze({ slot, component, surface: options.surface });
}

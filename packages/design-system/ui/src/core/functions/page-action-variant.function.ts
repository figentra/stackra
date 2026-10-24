/**
 * Stackra file contract:
 * Purpose: the look of one action drawn as a button by a Section: the first action is primary, the others secondary,
 *          and a danger action takes the danger colours in either role. The same rule as PageHeader's, so the two agree.
 * Boundary: pure; it names a `ButtonVariant` and draws nothing. PageHeader keeps its own copy until it takes this one.
 * Runtime: isomorphic
 * Governing contract: ADR 0314 (decision 1, the page actions row).
 */
import type { ButtonVariant } from "#contracts/enums/button-variant.enum";
import type { MenuLeafItem } from "#contracts/types/menu-leaf-item.type";

/**
 * The button variant of an action.
 * @param action - the action to draw
 * @param isPrimary - true for the first of the shown actions
 * @returns `primary` or `secondary`, or their danger forms for a danger action
 */
export function pageActionVariant(action: MenuLeafItem, isPrimary: boolean): ButtonVariant {
  if (action.tone === "danger") return isPrimary ? "danger" : "danger-soft";
  return isPrimary ? "primary" : "secondary";
}

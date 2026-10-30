/**
 * Stackra file contract:
 * Purpose: the props every runtime's `OverflowToolbar` takes: a named row of actions in priority order that shows as
 *          many as fit its width and moves the rest, from the end, into a "more" menu, with that menu's accessible name,
 *          the buttons' size and variant, and the handler for every action chosen from either place.
 * Boundary: types only. An action here is a button, so it takes no `href`; a link belongs in a menu or a page.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); ADR 0312; design-system
 *          gap inventory row 33 (2026-10-28).
 */
import type { ButtonVariant } from "#contracts/enums/button-variant.enum";
import type { Size } from "#contracts/enums/size.enum";
import type { MenuLeafItem } from "#contracts/types/menu-leaf-item.type";

/** Props shared by the web and native `OverflowToolbar`. */
export interface OverflowToolbarContractProps {
  /** The toolbar's accessible name, for example "Order actions". */
  readonly label: string;
  /** The actions in priority order: the first ones stay, the last ones overflow first. */
  readonly items: readonly Omit<MenuLeafItem, "href">[];
  /** The accessible name of the "more" button and its menu, for example "More order actions". */
  readonly moreLabel: string;
  /** The emphasis of every shown button. Defaults to `tertiary`. */
  readonly variant?: ButtonVariant | undefined;
  /** The size of every button. Defaults to `md`. */
  readonly size?: Size | undefined;
  /** Called with the key of every action chosen, as a button or from the menu, after the action's own `onPress`. */
  readonly onAction?: ((id: string) => void) | undefined;
}

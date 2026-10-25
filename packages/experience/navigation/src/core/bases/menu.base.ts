/**
 * Stackra file contract:
 * Purpose: `Menu`, the kind base of a menu: `class SiteMenu extends Menu({ kind: MenuKind.Navigation }) { items(m) {
 *          return [m.route(Routes.landing, { label })] } }` in an app's `menus/<name>.menu.ts`. One class describes
 *          its entries once for every place that shows it: a site header, the native tab bar, a context menu, the
 *          desktop menu bar or the tray.
 * Boundary: called only. `items(m)` is the author's, not the base's: declared here it would make every author write
 *           `override`, so `useMenu`, `ContextMenu` and `menuItems` take a `RunnableMenu` instead. Entries name routes
 *           by their `Routes.<key>` refs and actions by their client classes, never by strings. Dependencies arrive
 *           through the constructor.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 14, 16, 17 and 25); ADR 0305 (rules 2 and 3); ADR 0307 (panel placements
 *                     consume menus).
 */
import { createKind } from "@stackra/container";
import { Enum } from "@stackra/contracts";

import { MenuKind } from "#core/enums/menu-kind.enum";
import type { MenuClass } from "#core/types/menu-class.type";
import type { MenuOptions } from "#core/types/menu-options.type";

/** The instance side of every menu class. */
export interface Menu {
  /** Type-only kind brand, so a class of another kind cannot stand in for a menu. */
  readonly "~kind": "menu";
}

/**
 * Checks `options`.
 *
 * @throws RangeError when `kind` is not a `MenuKind` code.
 */
function readMenuOptions(options: MenuOptions): Readonly<Record<string, unknown>> {
  if (!Enum.values(MenuKind).includes(options.kind))
    throw new RangeError(`"${String(options.kind)}" is not a menu kind`);
  return { kind: options.kind };
}

/**
 * The menu kind base.
 *
 * @example
 * export class FooterMenu extends Menu({ kind: MenuKind.Navigation }) {
 *   items(m: MenuBuilder) {
 *     return [m.route(Routes.page, { label: I18n.web.footer.privacy, params: { "*": "privacy" } })];
 *   }
 * }
 */
export const Menu = createKind(
  "menu",
  // oxlint-disable-next-line typescript/no-extraneous-class -- reason: createKind needs a class; a menu's base holds nothing
  class MenuBase {},
  readMenuOptions,
) as (options: MenuOptions) => MenuClass;

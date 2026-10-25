/**
 * Stackra file contract:
 * Purpose: `SettingsNavigation`, where a module's generated settings page sits in the admin navigation: its group, its
 *          icon and its order within the group.
 * Boundary: a type only. The group is a lang key and the icon an icon name, both gen-emitted constants in authored
 *           code (R-56); the page's title and permissions are derived, so they are not options.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 22 and 24); final review R-56.
 */
import type { I18nKey } from "@stackra/i18n";
import type { IconName } from "@stackra/icons/contracts";

/**
 * The navigation entry of a settings page.
 *
 * @example
 * const navigation: SettingsNavigation = { group: I18n.orders.nav.sales, icon: Icons.Receipt, order: 20 };
 */
export interface SettingsNavigation {
  /** The navigation group the entry joins. */
  readonly group: I18nKey;

  /** The entry's icon. */
  readonly icon: IconName;

  /** Its place in the group, lowest first; gen orders entries without one after those with one. */
  readonly order?: number;
}

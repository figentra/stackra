/**
 * Stackra file contract:
 * Purpose: `linkedVendors`, the drawer port families the Android build links: the plugin's `vendors`, each once, in
 *          the table's order.
 * Boundary: internal. An unknown family name is a programming error in the app's config and throws at prebuild, so a
 *           typo never builds a till without its drawer.
 * Runtime: node
 * Governing contract: ADR 0478 (decision 2); ADR 0442 (decision 3).
 */
import { CASH_DRAWER_PLUGIN } from "#plugin/constants/cash-drawer-plugin.constant";
import type { CashDrawerPluginProps } from "#plugin/types/cash-drawer-plugin-props.type";
import type { CashDrawerVendorName } from "#plugin/types/cash-drawer-vendor-name.type";

/**
 * The families Android links for `props`.
 *
 * @example
 * linkedVendors({ vendors: ["pax", "sunmi"] }); // ["sunmi", "pax"]
 */
export function linkedVendors(props: CashDrawerPluginProps): CashDrawerVendorName[] {
  const asked = props.vendors ?? [];
  const table: readonly CashDrawerVendorName[] = CASH_DRAWER_PLUGIN.android;
  for (const vendor of asked) {
    if (!table.includes(vendor))
      throw new Error(`@stackra/native-cash-drawer: unknown vendor "${String(vendor)}"`);
  }
  return table.filter((vendor) => asked.includes(vendor));
}

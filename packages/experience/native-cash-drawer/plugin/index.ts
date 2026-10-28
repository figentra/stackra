/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./plugin` entry of @stackra/native-cash-drawer, whose default export is the config
 *          plugin `app.plugin.js` hands Expo, plus its option types.
 * Boundary: names each re-export and declares nothing. Build time only: nothing here runs in the app.
 * Runtime: node
 * Governing contract: ADR 0478 (decision 2); ADR 0294 (decision 15).
 */
export { withCashDrawer as default } from "#plugin/functions/with-cash-drawer.function";
export type { CashDrawerPluginProps } from "#plugin/types/cash-drawer-plugin-props.type";
export type { CashDrawerVendorName } from "#plugin/types/cash-drawer-vendor-name.type";
export type { VendorArtifact } from "#plugin/types/vendor-artifact.type";

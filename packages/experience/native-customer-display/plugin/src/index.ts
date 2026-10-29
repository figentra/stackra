/**
 * Stackra file contract:
 * Purpose: the config plugin entry of @stackra/native-customer-display, built to `dist/plugin.mjs` and re-exported by
 *          `app.plugin.js`: its default export is `withNativeCustomerDisplay`.
 * Boundary: names the default export and declares nothing.
 * Runtime: node
 * Governing contract: ADR 0478 (decision 2).
 */
export { withNativeCustomerDisplay as default } from "./with-native-customer-display.function";

/**
 * Stackra file contract:
 * Purpose: the config plugin entry of @stackra/native-spotlight, built to `dist/plugin.mjs` and re-exported by
 *          `app.plugin.js`: its default export is `withNativeSpotlight`.
 * Boundary: names the default export and declares nothing.
 * Runtime: node
 * Governing contract: ADR 0478 (decision 2).
 */
export { withNativeSpotlight as default } from "./with-native-spotlight.function";

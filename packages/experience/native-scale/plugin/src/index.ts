/**
 * Stackra file contract:
 * Purpose: the config plugin entry of @stackra/native-scale, built to `dist/plugin.mjs` and re-exported by
 *          `app.plugin.js`: its default export is `withNativeScale`.
 * Boundary: names the default export and declares nothing.
 * Runtime: node
 * Governing contract: ADR 0478 (decision 2).
 */
export { withNativeScale as default } from "./with-native-scale.function";

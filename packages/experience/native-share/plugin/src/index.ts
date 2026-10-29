/**
 * Stackra file contract:
 * Purpose: the config plugin entry of @stackra/native-share, built to `dist/plugin.mjs` and re-exported by
 *          `app.plugin.js`: its default export is `withNativeShare`.
 * Boundary: names the default export and declares nothing.
 * Runtime: node
 * Governing contract: ADR 0478 (decision 2).
 */
export { withNativeShare as default } from "./with-native-share.function";

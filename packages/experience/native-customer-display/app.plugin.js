/**
 * Stackra file contract:
 * Purpose: the config plugin entry Expo CLI resolves for `"plugins": ["@stackra/native-customer-display"]` (ADR 0478
 *          decision 2).
 * Boundary: re-exports the built plugin (`plugin/src` built to `dist/plugin.mjs`); Expo CLI on Node 24 loads it with
 *           require(esm) and takes the default export. Declares nothing.
 * Runtime: node
 * Governing contract: ADR 0478 (decisions 2 and 3).
 */
export { default } from "./dist/plugin.mjs";

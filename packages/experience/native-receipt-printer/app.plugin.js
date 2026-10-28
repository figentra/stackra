/**
 * Stackra file contract:
 * Purpose: the config plugin entry Expo resolves by package name (`plugins: [["@stackra/native-receipt-printer",
 *          { vendors: ["epson"] }]]`): it hands Expo the built plugin of `plugin/`.
 * Boundary: a re-export only; the plugin's code is `plugin/`. Node 24 loads the ES module through `require`.
 * Runtime: node
 * Governing contract: ADR 0478 (decision 2: the package's own config plugin).
 */
export { default } from "./dist/plugin.mjs";

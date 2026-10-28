/**
 * Stackra file contract:
 * Purpose: the file Expo's prebuild looks up when an app lists `@stackra/native-card-terminal` in its `plugins`: it
 *          hands over the built config plugin (`plugin/index.ts` built to `dist/plugin.mjs`).
 * Boundary: a re-export only; the plugin's logic and tests live in `plugin/`. Expo loads it with `require`, which
 *           Node 24 resolves for an ES module, and reads the default export.
 * Runtime: node
 * Governing contract: ADR 0478 (decision 2: the module package's own config plugin); ADR 0479 (decision 6).
 */
export { default } from "./dist/plugin.mjs";

/**
 * Stackra file contract:
 * Purpose: the role vocabulary of the vitest configs, one export per member role: `libraryPreset`
 *          (packages, coverage-gated), `servicePreset` (services), `appPreset` (the Vite and React
 *          Router apps), `mobilePreset` (the Expo app) and `toolingPreset` (the preset packages' own
 *          tests). `stackra gen` writes every member's `.stackra/vitest.config.ts` against these
 *          names, with a gitignored shim at the member root; only the tooling packages author their
 *          own config.
 * Boundary: re-exports only; the role presets live one per file under `functions/`, `constants/` and `types/`.
 *           No setup file, matcher or global setup is registered here.
 * Runtime: node
 * Governing contract: Stackra ADR 0005 (legacy decorators), Stackra ADR 0022 (test placement),
 *                     Stackra ADR 0295 decision 5 (generated tool configs)
 */
export { toolingPreset } from "./constants/tooling-preset.constant.ts";
export { appPreset } from "./functions/app-preset.function.ts";
export { libraryPreset } from "./functions/library-preset.function.ts";
export { mobilePreset } from "./functions/mobile-preset.function.ts";
export { servicePreset } from "./functions/service-preset.function.ts";
export type { AppPresetOptions } from "./types/app-preset-options.type.ts";
export type { LibraryPresetOptions } from "./types/library-preset-options.type.ts";
export type { MobilePresetOptions } from "./types/mobile-preset-options.type.ts";
export type { ServicePresetOptions } from "./types/service-preset-options.type.ts";

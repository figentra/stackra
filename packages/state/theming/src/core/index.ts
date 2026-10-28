/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/theming (`ColorScheme`, the configuration with its shipped
 *          schema, `ColorSchemeService` and the memory drivers of `SystemColorScheme` and `SystemAccessibility`) until `stackra gen` writes the
 *          entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. `ColorScheme` is declared once, in `@stackra/ui/contracts`
 *           (registry Q6), and re-exported here because apps name it beside `ThemingConfig`. The shipped schema is
 *           re-exported under the generated name (`ThemingConfig$`) a host's generated schemas extend. The ports are the
 *           `./contracts` entry's and is not re-exported here (one symbol, one entry).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { ColorScheme } from "@stackra/ui/contracts";
export { ThemingConfig } from "#config/theming.config";
export { THEMING_CONFIG_SCHEMA as ThemingConfig$ } from "#core/constants/theming-config-schema.constant";
export { MemorySystemAccessibilityDriver } from "#core/drivers/memory-system-accessibility.driver";
export { MemorySystemColorSchemeDriver } from "#core/drivers/memory-system-color-scheme.driver";
export { ThemingOptions } from "#core/schemas/theming-options.schema";
export { ColorSchemeService } from "#core/services/color-scheme.service";
export type { ColorSchemeState } from "#core/types/color-scheme-state.type";
export type { SchemeColors } from "#core/types/scheme-colors.type";
export type { Splash } from "#core/types/splash.type";

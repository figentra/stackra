/**
 * Stackra file contract:
 * Purpose: public surface of the brand-themes folder: the approved brand layers, their type and the theme builder.
 * Boundary: re-exports only.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 14).
 */
export { BRAND_THEMES } from "./brand-themes.constant";
export { buildBrandTheme } from "./build-brand-theme.function";
export { type BrandTheme } from "./brand-theme.type";

/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/brand-kit until `stackra gen` writes the entry barrels (STA-339):
 *          the kit schema and defaults, `parseKit`, the kit check, the JSON Schema checker, the pure planner of the
 *          generated set and its parts (icon canvas, web manifest, store frame, ICO packing, PNG size, symbol reader,
 *          outline path data) and `InvalidKitError`.
 * Boundary: names each re-export and declares nothing. Reading files, outlining fonts and rasterising are `./node`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { BRAND_KIT_SCHEMA } from "#core/constants/brand-kit-schema.constant";
export { KIT_DEFAULTS } from "#core/constants/kit-defaults.constant";
export { InvalidKitError } from "#core/errors/invalid-kit.error";
export { checkKit } from "#core/functions/check-kit.function";
export { icoOf } from "#core/functions/ico-of.function";
export { iconSvg } from "#core/functions/icon-svg.function";
export { parseKit } from "#core/functions/parse-kit.function";
export { pathData } from "#core/functions/path-data.function";
export { planBrand } from "#core/functions/plan-brand.function";
export { pngSize } from "#core/functions/png-size.function";
export { storeFrameSvg } from "#core/functions/store-frame-svg.function";
export { symbolOf } from "#core/functions/symbol-of.function";
export { validateJsonSchema } from "#core/functions/validate-json-schema.function";
export { webManifest } from "#core/functions/web-manifest.function";

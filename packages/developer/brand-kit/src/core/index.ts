/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/brand-kit (the generator, its steps and its data tables), until
 *          `stackra gen` writes the entry barrels (STA-339). The enums and types are exported from `./contracts` only.
 * Boundary: names each re-export and declares nothing.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15: one symbol, one entry); ADR 0441 (as amended: the generic generator).
 */
export { BRAND_DEFAULTS } from "#core/constants/brand-defaults.constant";
export { BRAND_SIZES } from "#core/constants/brand-sizes.constant";
export { DEVICE_FRAMES } from "#core/constants/device-frames.constant";
export { KIT_SOURCES } from "#core/constants/kit-sources.constant";
export { OUTPUT_SOURCES } from "#core/constants/output-sources.constant";
export { InvalidBrandKitError } from "#core/errors/invalid-brand-kit.error";
export { assetManifestOf } from "#core/functions/asset-manifest-of.function";
export { checkKitFiles } from "#core/functions/check-kit-files.function";
export { createResvgRenderer } from "#core/functions/create-resvg-renderer.function";
export { encodeIco } from "#core/functions/encode-ico.function";
export { generateBrand } from "#core/functions/generate-brand.function";
export { missingSources } from "#core/functions/missing-sources.function";
export { parseBrandKitArgs } from "#core/functions/parse-brand-kit-args.function";
export { readKit } from "#core/functions/read-kit.function";
export { runBrandKit } from "#core/functions/run-brand-kit.function";
export { storeFrameSvg } from "#core/functions/store-frame-svg.function";
export { validateKitJson } from "#core/functions/validate-kit-json.function";
export type { DeviceFrame } from "#core/types/device-frame.type";
export type { IcoImage } from "#core/types/ico-image.type";
export type { KitSource } from "#core/types/kit-source.type";
export type { StoreFrameContent } from "#core/types/store-frame-content.type";

/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/ui (the config class and core), which has several public
 *          files, until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel and config-entry decisions.
 */
export { UiConfig } from "#config/ui.config";
export { ICON_SIZES } from "#core/constants/icon-sizes.constant";
export { directionOf } from "#core/functions/direction-of.function";

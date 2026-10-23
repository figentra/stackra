/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/icons (the config class and core), which has several public
 *          files, until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel and config-entry decisions.
 */
export { IconsConfig } from "#config/icons.config";
export { ICON_ALIAS_TARGETS } from "#core/constants/icon-alias-targets.constant";
export { defineIconRegistry } from "#core/functions/define-icon-registry.function";
export { findIcon } from "#core/functions/find-icon.function";
export { isIconName } from "#core/functions/is-icon-name.function";

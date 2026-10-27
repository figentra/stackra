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
export { clearResourceQueryFilters } from "#core/functions/clear-resource-query-filters.function";
export { directionOf } from "#core/functions/direction-of.function";
export { initialsOf } from "#core/functions/initials-of.function";
export { isFilterValueEmpty } from "#core/functions/is-filter-value-empty.function";
export { isResourceQueryFiltered } from "#core/functions/is-resource-query-filtered.function";
export { markCurrentItems } from "#core/functions/mark-current-items.function";
export { warnUnknownIcon } from "#core/functions/warn-unknown-icon.function";
export type { CatalogueText } from "#core/types/catalogue-text.type";

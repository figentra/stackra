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
export { resolveMotion } from "#core/functions/resolve-motion.function";
export { viewStackKeyframes } from "#core/functions/view-stack-keyframes.function";
export type { ViewStackKeyframes } from "#core/types/view-stack-keyframes.type";
export { nativeStackAnimationOf } from "#core/functions/native-stack-animation-of.function";
export type { NativeStackAnimation } from "#core/types/native-stack-animation.type";
export { tweenNumber } from "#core/functions/tween-number.function";
export { tickerValueOf } from "#core/functions/ticker-value-of.function";
export { revealWordsOf } from "#core/functions/reveal-words-of.function";
export { SPRING } from "#core/constants/spring.constant";
export { chartCsvOf } from "#core/functions/chart-csv-of.function";
export { chartDataOf } from "#core/functions/chart-data-of.function";
export { sortChartItems } from "#core/functions/sort-chart-items.function";
export { updatedAgoOf } from "#core/functions/updated-ago-of.function";
export { formatChartCategory } from "#core/functions/format-chart-category.function";
export { formatChartNumber } from "#core/functions/format-chart-number.function";
export { initialsOf } from "#core/functions/initials-of.function";
export { isFilterValueEmpty } from "#core/functions/is-filter-value-empty.function";
export { isResourceQueryFiltered } from "#core/functions/is-resource-query-filtered.function";
export { isolateText } from "#core/functions/isolate-text.function";
export { isDirectionalIcon } from "#core/functions/is-directional-icon.function";
export { markCurrentItems } from "#core/functions/mark-current-items.function";
export { warnUnknownIcon } from "#core/functions/warn-unknown-icon.function";
export type { CatalogueText } from "#core/types/catalogue-text.type";
export { COUNTRY_DIAL_CODES } from "#core/constants/country-dial-codes.constant";
export { dateRangeOfPreset } from "#core/functions/date-range-of-preset.function";
export { flagOf } from "#core/functions/flag-of.function";
export { hexColorOf } from "#core/functions/hex-color-of.function";
export { localeNameOf } from "#core/functions/locale-name-of.function";
export { phoneValueOf } from "#core/functions/phone-value-of.function";
export { toGregorian } from "#core/functions/to-gregorian.function";
// Data collection (useCollection, DataView).
export { applyCollection } from "#core/functions/apply-collection.function";
export { collectionFilterMatches } from "#core/functions/collection-filter-matches.function";
export { collectionQueryOf } from "#core/functions/collection-query-of.function";
export { createLocalCollectionStore } from "#core/functions/create-local-collection-store.function";
export { sortCollectionItems } from "#core/functions/sort-collection-items.function";
export { fitColumnWidth } from "#core/functions/fit-column-width.function";
export { dataViewFieldsOf } from "#core/functions/data-view-fields-of.function";
export { collectionRuleFieldsOf } from "#core/functions/collection-rule-fields-of.function";
export { defaultCollectionStateOf } from "#core/functions/default-collection-state-of.function";
export { resolveCollectionColumns } from "#core/functions/resolve-collection-columns.function";

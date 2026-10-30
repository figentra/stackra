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
export { moveTreeNodes } from "#core/functions/move-tree-nodes.function";
export { maskValueOf } from "#core/functions/mask-value-of.function";
export { fileNamePartsOf } from "#core/functions/file-name-parts-of.function";
export { isolatedFileNameOf } from "#core/functions/isolated-file-name-of.function";
export type { FileNameParts } from "#core/types/file-name-parts.type";
export { SPRING } from "#core/constants/spring.constant";
export { CHART_CONTEXT_SHARE } from "#core/constants/chart-context-share.constant";
export { chartRampOf } from "#core/functions/chart-ramp-of.function";
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
export { previousRangeOf } from "#core/functions/previous-range-of.function";
export { flagOf } from "#core/functions/flag-of.function";
export { hexColorOf } from "#core/functions/hex-color-of.function";
export { listFormatOf } from "#core/functions/list-format-of.function";
export { localeNameOf } from "#core/functions/locale-name-of.function";
export { phoneValueOf } from "#core/functions/phone-value-of.function";
export { toGregorian } from "#core/functions/to-gregorian.function";
// Data collection (useCollection, DataView).
export { applyCollection } from "#core/functions/apply-collection.function";
export { createMemoryCollectionSource } from "#core/functions/create-memory-collection-source.function";
export { collectionFilterMatches } from "#core/functions/collection-filter-matches.function";
export { collectionQueryOf } from "#core/functions/collection-query-of.function";
export { collectionSelectionOf } from "#core/functions/collection-selection-of.function";
export { createLocalCollectionStore } from "#core/functions/create-local-collection-store.function";
export { sortCollectionItems } from "#core/functions/sort-collection-items.function";
export { fitColumnWidth } from "#core/functions/fit-column-width.function";
export { collectionColumnOfGrid } from "#core/functions/collection-column-of-grid.function";
export { dataGridColumnWidth } from "#core/functions/data-grid-column-width.function";
export { dataViewFieldsOf } from "#core/functions/data-view-fields-of.function";
export { collectionRuleFieldsOf } from "#core/functions/collection-rule-fields-of.function";
export { defaultCollectionStateOf } from "#core/functions/default-collection-state-of.function";
export { resolveCollectionColumns } from "#core/functions/resolve-collection-columns.function";
// Wave D: AI and the long tail (STA-1371).
export { barcodeOf } from "#core/functions/barcode-of.function";
export { code128CodesOf } from "#core/functions/code128-codes-of.function";
export { code128ModulesOf } from "#core/functions/code128-modules-of.function";
export { ean13CheckDigitOf } from "#core/functions/ean13-check-digit-of.function";
export { ean13ModulesOf } from "#core/functions/ean13-modules-of.function";
export { groupConversations } from "#core/functions/group-conversations.function";
export { isNearBottom } from "#core/functions/is-near-bottom.function";
export { createMockVoiceRecorder } from "#core/functions/create-mock-voice-recorder.function";
export { modelsByProvider } from "#core/functions/models-by-provider.function";
export { nextVoiceInputState } from "#core/functions/next-voice-input-state.function";
export { angleOfKey } from "#core/functions/angle-of-key.function";
export { angleOfPoint } from "#core/functions/angle-of-point.function";
export { clockFaceOf } from "#core/functions/clock-face-of.function";
export { clockTimeTextOf } from "#core/functions/clock-time-text-of.function";
export { dayPeriodsOf } from "#core/functions/day-periods-of.function";
export { mediaTimeOf } from "#core/functions/media-time-of.function";
export { snapAngle } from "#core/functions/snap-angle.function";
export { stepClockTime } from "#core/functions/step-clock-time.function";
export { timeOfClockAngle } from "#core/functions/time-of-clock-angle.function";
export type { ClockFace } from "#core/types/clock-face.type";

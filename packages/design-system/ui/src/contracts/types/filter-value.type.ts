/**
 * Stackra file contract:
 * Purpose: what a filter holds once the user has set it, per kind, and the whole set of applied filters as one plain
 *          object keyed by the filter's `id`. A filter that is not applied has no key, so the object is also the
 *          honest answer to "what is filtered right now".
 * Boundary: types only. The object is serialisable except for the `CalendarDate`s of a date range, which a URL codec
 *           writes as ISO text. Which kind a key holds comes from its `FilterDefinition`, never from the value.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0318.
 */
import type { FilterKind } from "#contracts/enums/filter-kind.enum";
import type { FilterValueByKind } from "#contracts/types/filter-value-by-kind.type";

/** The value of one filter, whatever its kind. */
export type FilterValue = FilterValueByKind[FilterKind];

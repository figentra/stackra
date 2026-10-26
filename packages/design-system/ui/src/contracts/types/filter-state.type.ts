/**
 * Stackra file contract:
 * Purpose: `FilterState`: the applied filters, by filter `id`.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0318.
 */
import type { FilterValue } from "#contracts/types/filter-value.type";

/** The applied filters, by filter `id`. A filter with no key is not applied. */
export type FilterState = Readonly<Record<string, FilterValue>>;

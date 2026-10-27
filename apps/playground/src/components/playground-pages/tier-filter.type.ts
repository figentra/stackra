/**
 * Stackra file contract:
 * Purpose: `TierFilter`: one tier filter value.
 * Boundary: a type only, in its own file.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0310 (decision 6); ADR 0305 (rule 10).
 */
import type { TIER_FILTERS } from "./tier-filters.constant";

/** One tier filter value. */
export type TierFilter = (typeof TIER_FILTERS)[number];

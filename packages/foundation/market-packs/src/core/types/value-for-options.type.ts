/**
 * Stackra file contract:
 * Purpose: `ValueForOptions`, what `ResolvedPackSource.valueFor` takes beyond the market and key: the date the value
 *          must be in force on, and the tenant's resolve options (pins, statuses, sections).
 * Boundary: a type only. `on` is `YYYY-MM-DD`; today's UTC date when left out.
 * Runtime: isomorphic
 * Governing contract: ADR 0418 (the resolved-pack source); ADR 0370 (decisions 4, 5 and 7).
 */
import type { ResolveOptions } from "#core/types/resolve-options.type";

/** Options of one value lookup. */
export type ValueForOptions = ResolveOptions & {
  /** The day the value must be in force; today (UTC) when left out. */
  readonly on?: string;
};

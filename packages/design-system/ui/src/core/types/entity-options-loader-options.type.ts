/**
 * Stackra file contract:
 * Purpose: `EntityOptionsLoaderOptions`: what the loader needs from its picker.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0318 (wave 7
 *          vocabulary, decision 2: cursor pages).
 */
import type { EntityOptionPage } from "#contracts/types/entity-option-page.type";

/** What the loader needs from its picker. */
export interface EntityOptionsLoaderOptions {
  /** Returns the picker's current `loadOptions`, read at each request. */
  readonly getLoad: () => (search: string, cursor?: string) => Promise<EntityOptionPage>;
  /** Returns the pause, in milliseconds, between the last keystroke and the search. */
  readonly getDebounceMs: () => number;
}

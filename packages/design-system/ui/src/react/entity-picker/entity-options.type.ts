/**
 * Stackra file contract:
 * Purpose: `EntityOptions`: what `useEntityOptions` returns.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0318 (wave 7
 *          vocabulary).
 */
import type { EntityOptionsState } from "#core/types/entity-options-state.type";

/** What {@link useEntityOptions} returns: the state to draw and the two requests a picker makes. */
export interface EntityOptions extends EntityOptionsState {
  /** Asks for the first page of `text`, at once the first time and after the pause later. */
  readonly search: (text: string) => void;
  /** Asks for the page after the last one. */
  readonly loadMore: () => void;
}

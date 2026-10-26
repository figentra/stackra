/**
 * Stackra file contract:
 * Purpose: `EntityOptionsState`: what the picker lists and whether it is waiting for more.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0318 (wave 7
 *          vocabulary, decision 2: cursor pages).
 */
import type { EntityOption } from "#contracts/types/entity-option.type";

/** What the picker lists and whether it is waiting for more. */
export interface EntityOptionsState {
  /** The records asked for so far, pages joined, a record once. */
  readonly options: readonly EntityOption[];
  /** `loading` while the first page of a search is on its way, `error` after a rejection, otherwise `idle`. */
  readonly status: "idle" | "loading" | "error";
  /** True while the page after the last one is on its way. */
  readonly isLoadingMore: boolean;
  /** True when the last answer named a next cursor. */
  readonly hasMore: boolean;
  /**
   * True once any request has been answered or has failed. Until then a picker cannot tell "nothing found" from "not
   * asked yet", so it lets its list open empty and asks.
   */
  readonly hasAnswered: boolean;
}

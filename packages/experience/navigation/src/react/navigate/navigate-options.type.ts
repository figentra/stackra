/**
 * Stackra file contract:
 * Purpose: `NavigateOptions`, the second argument of the function `useNavigate()` returns: the target's params,
 *          `search` and `hash`, plus whether the entry replaces the current one in the history and the state it
 *          carries.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0303 (decision 1).
 */
import type { HrefParams } from "#core/types/href-params.type";

/** How to navigate. */
export type NavigateOptions = HrefParams & {
  /** Replaces the current history entry instead of pushing one. */
  readonly replace?: boolean | undefined;
  /** History state for the next page. */
  readonly state?: unknown;
};

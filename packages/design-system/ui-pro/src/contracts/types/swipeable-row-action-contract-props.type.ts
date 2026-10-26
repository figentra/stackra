/**
 * Stackra file contract:
 * Purpose: `SwipeableRowActionContractProps`, props of `SwipeableRow.Action` that the Stackra vocabulary names.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-010.
 */
import type { Tone } from "@stackra/ui/contracts";

/** Props of `SwipeableRow.Action` that the Stackra vocabulary names. */
export interface SwipeableRowActionContractProps {
  /** The colour role; HeroUI Native Pro's colour-scheme `variant`, which has no `warning`. Defaults to `default`. */
  readonly tone?: Exclude<Tone, "warning"> | undefined;
}

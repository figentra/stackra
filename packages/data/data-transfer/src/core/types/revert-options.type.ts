/**
 * Stackra file contract:
 * Purpose: `RevertOptions`, the undo window of `ImportRunner.revert`.
 * Boundary: a type only; the window is the caller's setting (OS-163), never a number in this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 8); ADR 0363 (decision 1).
 */
import type { Duration } from "@stackra/contracts";

/** How a revert is bounded. */
export interface RevertOptions {
  /** How long after the run settled it may be reverted. */
  readonly window: Duration;
}

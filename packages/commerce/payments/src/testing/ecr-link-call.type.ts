/**
 * Stackra file contract:
 * Purpose: `EcrLinkCall`, one call `EcrLinkFake` recorded: which call, its payload as text and the timing passed.
 * Boundary: test support from `./testing`.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (fakes in ./testing); ADR 0377.
 */
import type { EcrTiming } from "#contracts/types/ecr-timing.type";

/** One call the fake saw. */
export interface EcrLinkCall {
  /** `exchange` or `signal`. */
  readonly kind: "exchange" | "signal";
  /** The payload, decoded as text. */
  readonly payload: string;
  /** The timing the driver passed. */
  readonly timing: EcrTiming;
}

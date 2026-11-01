/**
 * Stackra file contract:
 * Purpose: `ConsumerGateAllowEntry`, one allow-list entry: a known failure excused until it expires.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */

/** One well-formed allow-list entry; `expired` is set against the run date. */
export type ConsumerGateAllowEntry = {
  readonly product: string;
  readonly step: string;
  readonly class: string;
  readonly match: string;
  readonly issue: string;
  readonly added: string;
  readonly expires: string;
  readonly expired: boolean;
};

/**
 * Stackra file contract:
 * Purpose: `ConsumerGateAllowEntry`, one allow-list entry: a known failure excused until it expires.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */

/** One well-formed allow-list entry; `expired` is set against the run date. */
export type ConsumerGateAllowEntry = {
  /** The product whose run the entry excuses. */
  readonly product: string;

  /** The step id it covers; a base id such as `test:int` also covers `test:int/billing`. */
  readonly step: string;

  /** Why the failure is excused: `product`, `flaky`, `environment` or `known-core`. */
  readonly class: string;

  /** The text a failure line must contain to be excused. */
  readonly match: string;

  /** The STA issue that tracks the fix. */
  readonly issue: string;

  /** The day the entry was added, `YYYY-MM-DD`. */
  readonly added: string;

  /** The last day the entry excuses a failure, `YYYY-MM-DD`. */
  readonly expires: string;

  /** True when `expires` is before the run date. */
  readonly expired: boolean;
};

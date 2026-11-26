/**
 * Stackra file contract:
 * Purpose: `AcceptedBreak`, one entry of `tools/contract/accepted-breaks.yaml`: a breaking HTTP contract change a
 *          member makes on purpose, excused until it expires.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4); STA-2837.
 */

/** One well-formed accepted break; `expired` is set against the run date. */
export type AcceptedBreak = {
  /** The member folder, repository-relative (`services/billing`). */
  readonly member: string;

  /** The operation, `<METHOD> <path>` as the OpenAPI projection spells it (`POST /invoices/{invoiceId}/void`). */
  readonly operation: string;

  /** The `oasdiff` rule id the break carries (`api-path-removed-without-deprecation`). */
  readonly id: string;

  /** The issue key that records the decision (`STA-2837`). */
  readonly issue: string;

  /** Why the break is accepted: who consumes the operation and how they move. */
  readonly reason: string;

  /** The day the entry was added, `YYYY-MM-DD`. */
  readonly added: string;

  /** The last day the entry excuses the break, `YYYY-MM-DD`. */
  readonly expires: string;

  /** Whether `expires` is before the run date, so the entry excuses nothing. */
  readonly expired: boolean;
};

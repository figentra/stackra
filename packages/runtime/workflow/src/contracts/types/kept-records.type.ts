/**
 * Stackra file contract:
 * Purpose: `KeptRecords`, one entry of a `ServiceAcked` payload: a kind of record the acking service kept instead of
 *          disposing of it, why, and how many (a privacy erasure's receipt lists what each service kept).
 * Boundary: a type only; counts, never record ids or contents, so the ack carries no personal data. The reason is the
 *           kind of rule that kept the rows (a legal hold, or a retention floor or declared schedule), never the rule
 *           itself: the holds and retention service owns those. `unredacted` is no rule: copies an erasure found but
 *           could not redact (a platform outbox message, STA-2629), so a waiting erasure reads as incomplete.
 * Runtime: isomorphic
 * Governing contract: ADR 0210 (decision 6); ADR 0134 (legal holds); ADR 0189 (erasure acks); STA-1241, STA-1312
 *                     (compliance-privacy open question 3).
 */

/** Records of one kind an acking service kept. */
export interface KeptRecords {
  /** The model key of the kept rows (`orders.order`). */
  readonly kind: string;

  /**
   * `hold` for rows a legal hold covers; `retention` for rows a retention floor or declared schedule keeps;
   * `unredacted` for copies the erasure could not reach, which still carry personal data and need a platform operator.
   */
  readonly reason: "hold" | "retention" | "unredacted";

  /** How many rows of the kind were kept. */
  readonly count: number;
}

/**
 * Stackra file contract:
 * Purpose: `JscpdReport`, the part of jscpd's JSON report the duplication ratchet reads: the scanned and duplicated
 *          line totals.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: rule-gap B-9 (notes handover/testing/rule-gap-list.md); ADR 0022 (tests beside the code).
 */

/** A jscpd JSON report. */
export type JscpdReport = {
  /** The statistics block. */
  readonly statistics?: {
    /** The totals over every format. */
    readonly total?: {
      /** Lines scanned. */
      readonly lines?: number;
      /** Lines in a clone. */
      readonly duplicatedLines?: number;
    };
  };
};

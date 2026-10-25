/**
 * Stackra file contract:
 * Purpose: `FieldPermissions`, what a principal may not do with the fields of one record: the fields hidden from it
 *          and the fields it may read but not write.
 * Boundary: a type only, `PolicyDecisionPointService.fieldAccess`'s answer. A hidden field is never in `readOnly` too.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decision 3); STA-595.
 */

/** The field-level answer. */
export interface FieldPermissions {
  /** Left out of reads, refused in writes. */
  readonly hidden: readonly string[];

  /** Read, refused in writes. */
  readonly readOnly: readonly string[];
}

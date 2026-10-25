/**
 * Stackra file contract:
 * Purpose: `RowIssue`, one reason a mapped row failed its target's schema.
 * Boundary: a type only; the message is the schema's, and the field is the dotted path in the mapped record.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 6).
 */

/** Why a field of a row was refused. */
export interface RowIssue {
  /** The dotted field path (`price`, `""` for the whole row). */
  readonly field: string;

  /** The schema's issue code (`invalid_type`). */
  readonly code: string;

  /** The schema's message. */
  readonly message: string;
}

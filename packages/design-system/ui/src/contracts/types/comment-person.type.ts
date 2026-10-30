/**
 * Stackra file contract:
 * Purpose: `CommentPerson`, someone who writes or is mentioned in a comment thread.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0225 (comments); STA-1371.
 */

/** A person in a comment thread. */
export interface CommentPerson {
  /** A stable id, handed back for mentions. */
  readonly id: string;
  /** The name shown and matched after `@`. */
  readonly name: string;
  /** The address of their picture; initials are drawn without it. */
  readonly avatar?: string | undefined;
}

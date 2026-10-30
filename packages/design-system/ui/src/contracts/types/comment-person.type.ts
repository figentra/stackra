/**
 * Stackra file contract:
 * Purpose: `CommentPerson`, someone who writes or is mentioned in a comment thread.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0225 (comments); STA-1371.
 */

/** A person in a comment thread. */
export interface CommentPerson {
  readonly id: string;
  readonly name: string;
  readonly avatar?: string | undefined;
}

/**
 * Stackra file contract:
 * Purpose: `TagRejection`, a tag a TagInput refused and why: a duplicate, over the maximum, or invalid with the
 *          caller's message.
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371.
 */

/** A refused tag. */
export interface TagRejection {
  readonly tag: string;
  readonly reason: "duplicate" | "max" | "invalid";
  /** The caller's words, for an invalid tag. */
  readonly message?: string | undefined;
}

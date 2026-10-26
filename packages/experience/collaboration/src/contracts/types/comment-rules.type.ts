/**
 * Stackra file contract:
 * Purpose: `CommentRules`, the consumer's settings a comment write is checked against: whether shared comments are
 *          open and the assistant's handle.
 * Boundary: a type only. The values are tenant settings the consumer reads (seeded per product, editable on the
 *           dashboard); the package has no default for either.
 * Runtime: isomorphic
 * Governing contract: ADR 0433 (decision 4); config-model (configuration, not code); OS-224, OS-226.
 */

/** The settings of one comment write. */
export interface CommentRules {
  /** Whether a comment may be shared with external participants. */
  readonly sharedComments: boolean;

  /** The assistant's display handle (`Tamo`); null while the assistant may not be mentioned. */
  readonly assistantHandle: string | null;
}

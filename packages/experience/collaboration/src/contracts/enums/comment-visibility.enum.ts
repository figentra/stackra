/**
 * Stackra file contract:
 * Purpose: `CommentVisibility`, who may read a comment: `internal` (the tenant's own people) or `shared` (also the
 *          external participants of the record, such as a client on a matter).
 * Boundary: an `Enum.of` in the leaf entry. Which one a new comment takes by default, and whether `shared` is open at
 *           all, are the consumer's settings; the floor that an external participant never reads or is mentioned on an
 *           internal comment is `checkMentions`'s and the consumer policy's.
 * Runtime: isomorphic
 * Governing contract: ADR 0433 (decision 2); OS-224.
 */
import { Enum } from "@stackra/contracts";

/** The two levels of a comment. */
export const CommentVisibility = Enum.of({
  /** The tenant's own people only. */
  Internal: "internal",
  /** Also the record's external participants. */
  Shared: "shared",
});

/** One of the levels above. */
export type CommentVisibility = Enum.Value<typeof CommentVisibility>;

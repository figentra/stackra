/**
 * Stackra file contract:
 * Purpose: `RevokedCopy`, what happens to the copies of an item kind the receiving tenant already holds when a share
 *          is revoked: kept as severed copies, or deleted.
 * Boundary: an `Enum.of` value plus the type of the same name. The choice per item kind is data on the share (the
 *           product's defaults seed it); a copy under a legal hold is kept whatever the share says.
 * Runtime: isomorphic
 * Governing contract: ADR 0343 (decision 5); ADR 0134 (legal holds).
 */
import { Enum } from "@stackra/contracts";

/** What revocation does to a received copy. */
export const RevokedCopy = Enum.of({
  /** The copy stays as a severed copy: no further update reaches it. */
  Keep: "keep",
  /** The copy is deleted. */
  Delete: "delete",
});

/** One of the codes above. */
export type RevokedCopy = Enum.Value<typeof RevokedCopy>;

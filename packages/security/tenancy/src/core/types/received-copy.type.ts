/**
 * Stackra file contract:
 * Purpose: `ReceivedCopy`, a copy the receiving tenant holds of a shared item, as revocation sees it: the copy, its
 *          item kind, whether a legal hold covers it, and the share it came from.
 * Boundary: a type only. The copy lives in the receiver's own tables under its own `tenant_id`; this names it by id.
 * Runtime: isomorphic
 * Governing contract: ADR 0343 (decisions 2, 3 and 5); ADR 0134 (legal holds).
 */
import type { PublicId } from "@stackra/contracts";

/** One received copy. */
export interface ReceivedCopy {
  /** The copy's public id in the receiving tenant. */
  readonly id: PublicId;

  /** The item kind it was shared as. */
  readonly kind: string;

  /** A legal hold covers it, so it is never deleted on revocation. */
  readonly held: boolean;
}

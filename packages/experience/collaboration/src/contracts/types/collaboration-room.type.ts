/**
 * Stackra file contract:
 * Purpose: `CollaborationRoom`, where people meet: the document they watch or co-edit and the scope-tree node it
 *          belongs to.
 * Boundary: a type only, in the leaf entry. A room is keyed by its document's public id; the scope is the node the
 *           entitlement grant is read for and a server driver isolates by. It never names a tenant (R-59).
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decisions 5 and 6); ADR 0327 (decision 5: `ScopeRef`); ADR 0135 (public ids).
 */
import type { PublicId, ScopeRef } from "@stackra/contracts";

/** One document's room. */
export interface CollaborationRoom {
  /** The public id of the document watched or co-edited in this room (`pag_…`). */
  readonly document: PublicId;

  /** The scope node the document belongs to; absent for a platform-wide document. */
  readonly scope?: ScopeRef;
}

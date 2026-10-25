/**
 * Stackra file contract:
 * Purpose: `TenantShare`, one consented pair joining a record of one tenant to a record of another: who proposed, who
 *          receives, the two records, the item kinds that may travel with their terms, whether the two tenants are in
 *          different regions or deployments, and its state with the times it changed.
 * Boundary: a type only, a tenancy model's shape (ADR 0343 decision 1). It is not a grant and confers no scope-tree
 *           position (decision 7). Across regions nothing flows by events: each item is released (decision 4).
 * Runtime: isomorphic
 * Governing contract: ADR 0343 (decisions 1 to 5 and 7).
 */
import type { PublicId } from "@stackra/contracts";

import type { ShareStatus } from "#core/enums/share-status.enum";
import type { ShareItemTerms } from "#core/types/share-item-terms.type";
import type { SharedRecordRef } from "#core/types/shared-record-ref.type";

/** A cross-tenant share. */
export interface TenantShare {
  /** The share's public id. */
  readonly id: PublicId<"shr">;

  /** The tenant that proposed it and whose record is shared. */
  readonly proposer: PublicId<"scp">;

  /** The tenant asked to accept it. */
  readonly receiver: PublicId<"scp">;

  /** The proposer's record. */
  readonly source: SharedRecordRef;

  /** The receiver's record the share joins, once it accepted. */
  readonly target?: SharedRecordRef;

  /** Item kind to its terms; a kind not listed never travels. */
  readonly items: Readonly<Record<string, ShareItemTerms>>;

  /** The tenants are in different regions or deployments: no event feed, only released items. */
  readonly crossRegion: boolean;

  /** Where it stands. */
  readonly status: ShareStatus;

  /** When it was proposed. */
  readonly proposedAt: Date;

  /** When it was accepted, declined or revoked last. */
  readonly changedAt: Date;

  /** The tenant that revoked it, once revoked. */
  readonly revokedBy?: PublicId<"scp">;
}

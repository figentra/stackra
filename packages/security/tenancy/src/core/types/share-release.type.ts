/**
 * Stackra file contract:
 * Purpose: `ShareRelease`, one item a user of the sending tenant released on a cross-region share: the share, the item,
 *          the legal entity whose rules allowed it and when.
 * Boundary: a type only; the OS service audits it and sends the copy. Ids only.
 * Runtime: isomorphic
 * Governing contract: ADR 0343 (decision 4).
 */
import type { PublicId } from "@stackra/contracts";

import type { SharedRecordRef } from "#core/types/shared-record-ref.type";

/** One released item. */
export interface ShareRelease {
  /** The share it travels on. */
  readonly share: PublicId<"shr">;

  /** The item released. */
  readonly item: SharedRecordRef;

  /** The sending legal entity whose transfer rules allowed it. */
  readonly legalEntity: PublicId;

  /** When it was released. */
  readonly releasedAt: Date;
}

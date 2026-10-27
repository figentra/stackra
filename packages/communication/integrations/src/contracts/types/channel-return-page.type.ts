/**
 * Stackra file contract:
 * Purpose: `ChannelReturnPage`, one page of returns a sales channel reports, with the cursor of the next page.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0218 (decision 3: syncs); ADR 0447 (decision 3).
 */
import type { ChannelReturn } from "#contracts/types/channel-return.type";

/** A page of imported returns. */
export interface ChannelReturnPage {
  /** The returns, oldest change first. */
  readonly returns: readonly ChannelReturn[];

  /** The cursor of the next page; undefined on the last. */
  readonly next?: string;
}

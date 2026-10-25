/**
 * Stackra file contract:
 * Purpose: `ChannelOrderPage`, one page of orders a sales channel returns, with the cursor of the next page.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0218 (decision 3: syncs); COM-301.
 */
import type { ChannelOrder } from "#contracts/types/channel-order.type";

/** A page of imported orders. */
export interface ChannelOrderPage {
  /** The orders, oldest change first. */
  readonly orders: readonly ChannelOrder[];

  /** The cursor of the next page; undefined on the last. */
  readonly next?: string;
}

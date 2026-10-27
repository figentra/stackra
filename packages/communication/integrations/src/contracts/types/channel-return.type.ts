/**
 * Stackra file contract:
 * Purpose: `ChannelReturn`, a return a buyer opened on a sales channel: which order, which lines, why, and the refund
 *          the channel gave or proposes.
 * Boundary: a type only. The status is the channel's spelling; the importer maps it to our return states.
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 3); COM-301.
 */
import type { Money } from "@stackra/money";

/** An imported return. */
export interface ChannelReturn {
  /** The channel's return id. */
  readonly externalId: string;

  /** The channel's id of the order returned. */
  readonly orderExternalId: string;

  /** When the buyer opened it. */
  readonly requestedAt: Date;

  /** The channel's state, as the channel spells it. */
  readonly status: string;

  /** The lines returned, by our SKU. */
  readonly lines: readonly {
    readonly sku: string;
    readonly quantity: number;
    readonly reason?: string;
  }[];

  /** The refund the channel gave or proposes. */
  readonly refund?: Money;
}

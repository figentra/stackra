/**
 * Stackra file contract:
 * Purpose: `ChannelOrderLine`, one line of an order imported from a sales channel: our SKU, the quantity and the unit
 *          price the channel charged.
 * Boundary: a type only. The SKU is ours: the connector maps the channel's listing to it.
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decisions 1 and 6); COM-301.
 */
import type { Money } from "@stackra/money";

/** An imported order line. */
export interface ChannelOrderLine {
  /** Our SKU. */
  readonly sku: string;

  /** How many. */
  readonly quantity: number;

  /** What the channel charged for one, tax as the channel reports it. */
  readonly unitPrice: Money;
}

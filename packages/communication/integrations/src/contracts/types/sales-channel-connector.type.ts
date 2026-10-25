/**
 * Stackra file contract:
 * Purpose: `SalesChannelConnector`, what a sales channel's Connection implements (a marketplace such as Amazon, noon,
 *          Salla or Zid, or another shop): import orders changed since a time, acknowledge them, mark them shipped,
 *          and push stock levels and prices.
 * Boundary: an interface a Connection implements when its Integration declares `ConnectorKind.SalesChannel`. Which
 *           channels a Market lists and at what price is data (`connector-catalogue`, ADR 0355 decision 6). Pushes
 *           are whole-value (set, never add), so a retried push is harmless.
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decisions 1 and 6); ADR 0218 (decision 3); COM-296, COM-301.
 */
import type { Money } from "@stackra/money";

import type { ChannelOrderPage } from "#contracts/types/channel-order-page.type";

/**
 * A sales channel account.
 *
 * @example
 * const page = await channel.orders(lastSync, cursor);
 */
export interface SalesChannelConnector {
  /** Orders created or changed since `since`, a page at a time. */
  orders(since: Date, cursor?: string): Promise<ChannelOrderPage>;

  /** Tells the channel we took order `externalId`. */
  acknowledge(externalId: string): Promise<void>;

  /** Tells the channel order `externalId` shipped, with the carrier and tracking number. */
  markShipped(
    externalId: string,
    shipment: { readonly carrier: string; readonly trackingNumber: string },
  ): Promise<void>;

  /** Sets the sellable quantity of each SKU on the channel. */
  setStock(levels: readonly { readonly sku: string; readonly available: number }[]): Promise<void>;

  /** Sets the price of each SKU on the channel. */
  setPrices(prices: readonly { readonly sku: string; readonly price: Money }[]): Promise<void>;
}

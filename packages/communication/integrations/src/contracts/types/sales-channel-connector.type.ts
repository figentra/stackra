/**
 * Stackra file contract:
 * Purpose: `SalesChannelConnector`, what a sales channel's Connection implements (a marketplace such as Amazon, noon,
 *          Salla or Zid, a delivery app such as Talabat, Deliveroo or HungerStation, or another shop): import orders
 *          changed since a time, acknowledge, reject or cancel them, quote a prep time, mark them shipped, push stock
 *          levels and prices, and, where the channel has them, the menu with its modifiers, item availability,
 *          listing content and returns.
 * Boundary: an interface a Connection implements when its Integration declares `ConnectorKind.SalesChannel`. The
 *           first five methods every channel has; the optional ones only the channels that support them (a delivery
 *           app has a menu and prep times, a marketplace has listings and returns), so a caller checks a method is
 *           there, through `accepts` of `ConnectorGateway#channel`, before it calls it. Which channels a Market lists
 *           and at what price is data (`connector-catalogue`, ADR 0355 decision 6). Pushes are whole-value (set, never
 *           add), so a retried push is harmless.
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decisions 1 and 6); ADR 0218 (decision 3); ADR 0447 (decision 3); COM-296, COM-301;
 *                     STA-754.
 */
import type { Money } from "@stackra/money";

import type { ChannelListing } from "#contracts/types/channel-listing.type";
import type { ChannelMenu } from "#contracts/types/channel-menu.type";
import type { ChannelOrderPage } from "#contracts/types/channel-order-page.type";
import type { ChannelReturnPage } from "#contracts/types/channel-return-page.type";

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

  /** Refuses order `externalId` before it is prepared, with the reason the channel shows the buyer. */
  reject?(externalId: string, reason: string): Promise<void>;

  /** Cancels order `externalId` after it was acknowledged, with the reason the channel shows the buyer. */
  cancel?(externalId: string, reason: string): Promise<void>;

  /** Tells the channel order `externalId` is ready in `minutes`, so it sends the courier in time. */
  setPrepTime?(externalId: string, minutes: number): Promise<void>;

  /** Replaces the store's whole menu, its sections, items and modifier groups. */
  setMenu?(menu: ChannelMenu): Promise<void>;

  /** Marks each item or modifier option (by SKU) orderable or not, until a time when given. */
  setAvailability?(
    items: readonly { readonly sku: string; readonly available: boolean; readonly until?: Date }[],
  ): Promise<void>;

  /**
   * Creates or replaces the listing content of each product.
   *
   * @returns the SKUs the channel refused, each with the channel's reason.
   */
  setListings?(
    listings: readonly ChannelListing[],
  ): Promise<readonly { readonly sku: string; readonly reason: string }[]>;

  /** Returns opened or changed since `since`, a page at a time. */
  returns?(since: Date, cursor?: string): Promise<ChannelReturnPage>;
}

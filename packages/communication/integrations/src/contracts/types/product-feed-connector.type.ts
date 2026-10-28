/**
 * Stackra file contract:
 * Purpose: `ProductFeedConnector`, what a product feed's Connection implements (Google Merchant Center, the Meta, TikTok
 *          and Snap catalogues): upsert items and remove them, reporting each item the feed refused.
 * Boundary: an interface a Connection implements when its Integration declares `ConnectorKind.ProductFeed`. Upserts are
 *           whole items, so a retry is harmless.
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decisions 1 and 5); COM-301.
 */
import type { FeedItem } from "#contracts/types/feed-item.type";

/**
 * A product feed account.
 *
 * @example
 * const refused = await feed.upsert(items);
 */
export interface ProductFeedConnector {
  /**
   * Creates or replaces `items`.
   *
   * @returns the SKUs the feed refused, each with the feed's reason.
   */
  upsert: (
    items: readonly FeedItem[],
  ) => Promise<readonly { readonly sku: string; readonly reason: string }[]>;

  /** Removes the items of `skus`; an unknown SKU is ignored. */
  remove: (skus: readonly string[]) => Promise<void>;
}

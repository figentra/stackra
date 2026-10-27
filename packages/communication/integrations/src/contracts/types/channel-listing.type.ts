/**
 * Stackra file contract:
 * Purpose: `ChannelListing`, the content of one product's listing on a marketplace: title, description, images and the
 *          marketplace's own attributes, in one language.
 * Boundary: a type only, pushed whole (`SalesChannelConnector#setListings`). Stock and price travel separately
 *           (`setStock`, `setPrices`), so a content change never touches them.
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 3); ADR 0355 (decision 6); COM-301.
 */
import type { Url } from "@stackra/contracts";

/** A product's listing content on a channel. */
export interface ChannelListing {
  /** Our SKU. */
  readonly sku: string;

  /** The BCP 47 language of the text. */
  readonly locale: string;

  /** The title. */
  readonly title: string;

  /** The description. */
  readonly description: string;

  /** The images, main one first. */
  readonly images: readonly Url[];

  /** The GTIN, when the product has one. */
  readonly gtin?: string;

  /** Marketplace-specific attributes, by the marketplace's names. */
  readonly attributes?: Readonly<Record<string, string>>;
}

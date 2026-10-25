/**
 * Stackra file contract:
 * Purpose: `FeedItem`, one product as a product feed (a shopping catalogue, an ad catalogue) takes it.
 * Boundary: a type only. The connector maps these fields to the feed's own attributes; feed-specific attributes go in
 *           `attributes`, keyed by the feed's names.
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decisions 1 and 5); COM-301.
 */
import type { Money } from "@stackra/money";
import type { Url } from "@stackra/contracts";

/** A product in a feed. */
export interface FeedItem {
  /** Our SKU, the feed's item id. */
  readonly sku: string;

  /** The title in the feed's language. */
  readonly title: string;

  /** The description in the feed's language. */
  readonly description: string;

  /** The product page. */
  readonly link: Url;

  /** The main image. */
  readonly image: Url;

  /** The price shown. */
  readonly price: Money;

  /** Whether it can be bought now. */
  readonly inStock: boolean;

  /** The GTIN, when the product has one. */
  readonly gtin?: string;

  /** The brand. */
  readonly brand?: string;

  /** Feed-specific attributes, by the feed's names. */
  readonly attributes?: Readonly<Record<string, string>>;
}

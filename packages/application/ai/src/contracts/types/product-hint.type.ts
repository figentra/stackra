/**
 * Stackra file contract:
 * Purpose: `ProductHint`, one product a page describes in its schema.org `Product` markup (JSON-LD): the name, the
 *          description, the SKU and brand, the images, the page URL, and the first offer's price, currency and
 *          availability.
 * Boundary: a type only. A hint, never a record: it is what the page claims, read from untrusted markup, and a
 *           consumer (Commerce's store-from-a-URL) turns it into a draft a person reviews. URLs are absolute; the price
 *           is the decimal string the page wrote, never a float.
 * Runtime: isomorphic
 * Governing contract: ADR 0450 (decision 2); STA-904 (page reader); Commerce STA-728.
 */

/** One product a page describes. */
export interface ProductHint {
  /** The product name. */
  readonly name: string;

  /** The product description, as the page wrote it. */
  readonly description?: string;

  /** The seller's SKU. */
  readonly sku?: string;

  /** The brand name. */
  readonly brand?: string;

  /** Absolute http(s) image URLs, in the page's order. */
  readonly images: readonly string[];

  /** The product page's absolute URL. */
  readonly url?: string;

  /** The first offer's price (or an aggregate offer's low price) as a decimal string, e.g. `"129.00"`. */
  readonly price?: string;

  /** The first offer's ISO 4217 currency code, as the page wrote it. */
  readonly currency?: string;

  /** The first offer's schema.org availability without its prefix, e.g. `InStock`. */
  readonly availability?: string;
}

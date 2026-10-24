/**
 * Stackra file contract:
 * Purpose: `Seo`, one link of the SEO chain: the fields a route's `meta()` returns (and the app defaults, the route's
 *          static `seo` and the tenant's SEO record carry): title, description, image, Open Graph type, `noindex`,
 *          an explicit canonical URL and JSON-LD blocks.
 * Boundary: a type only. Every field is optional: a link passes only what differs, and `resolveSeo` derives the rest
 *           (canonical, alternates, site name, image). An `undefined` field keeps the earlier link's value.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decision 7).
 */
import type { JsonLd } from "#core/types/json-ld.type";

/** One link of the SEO chain. */
export interface Seo {
  /** The page title, before the title template wraps it. */
  readonly title?: string | undefined;
  /** The meta description and the Open Graph description. */
  readonly description?: string | undefined;
  /** The absolute Open Graph image URL; derived from the site's card when left out. */
  readonly image?: string | undefined;
  /** The Open Graph type (`website`, `article`, `product`); `website` when left out. */
  readonly type?: string | undefined;
  /** Keep the page out of search; a non-indexable site is `noindex` whatever a link says. */
  readonly noindex?: boolean | undefined;
  /** An absolute canonical URL; derived from the request URL when left out. */
  readonly canonical?: string | undefined;
  /** Structured-data blocks; a later link's list replaces an earlier one's. */
  readonly jsonLd?: readonly JsonLd[] | undefined;
}

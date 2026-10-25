/**
 * Stackra file contract:
 * Purpose: the `OgRenderer` port: turns an Open Graph card into PNG bytes, so the OG image route answers
 *          `/og/<kind>/<id>` with a picture crawlers and chat apps accept.
 * Boundary: an abstract class that is its own token, keyed `seo.OgRenderer`. It renders only; what the card says
 *           (title, colours, picture) is the route's choice, and caching is the route's `Cache-Control`. A failure
 *           (a font or picture that cannot be fetched) throws, so the route answers an error, never a broken image.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 15, 16 and 17); ADR 0263 (ports resolve by type); ADR 0301 (decision 7).
 */
import { Port } from "@stackra/contracts";

import type { OgCard } from "#contracts/types/og-card.type";

/**
 * Renders Open Graph images.
 *
 * @example
 * const png = await this.og.render({ template: OgKind.Site, width: 1200, height: 630, title, siteName, dir, brand, logo });
 */
export abstract class OgRenderer extends Port {
  /** Type-only port key, so `DriverName<OgRenderer>` narrows to this port's drivers. */
  declare readonly "~key": "seo.OgRenderer";

  /**
   * The PNG of `card`.
   *
   * @throws Error when a font or the card's picture cannot be fetched, or the card cannot be laid out.
   */
  abstract render(card: OgCard): Promise<Uint8Array<ArrayBuffer>>;
}

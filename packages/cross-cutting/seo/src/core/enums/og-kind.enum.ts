/**
 * Stackra file contract:
 * Purpose: `OgKind`, the kinds of Open Graph image a site renders at `/og/<kind>/<id>`: the site itself, a builder
 *          page and a product. `SeoConfig.og.kinds` lists the ones the route answers; a route's `meta()` builds its
 *          `image` URL from one.
 * Boundary: an `Enum.of` value plus the type of the same name. The code is the URL segment and the card template
 *           (`OgCard.template`); a product card shows the product's image beside the title.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decision 7: the derived Open Graph image); ADR 0294 (decision 16: the Enum row);
 *                     ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** The Open Graph image kinds. */
export const OgKind = Enum.of({
  /** The site's own card: its name over its colours; the landing page and the Organization logo. */
  Site: "site",
  /** A page built in the page builder, keyed by its document key. */
  Page: "page",
  /** A storefront product, keyed by its slug; the card shows the first product image. */
  Product: "product",
});

/** One of the codes above. */
export type OgKind = Enum.Value<typeof OgKind>;

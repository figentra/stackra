/**
 * Stackra file contract:
 * Purpose: `ResolvedSeo`, the head of one page after the SEO chain ran: the templated title, description, canonical
 *          URL, hreflang alternates, Open Graph image and type, `noindex`, the site name and JSON-LD already escaped.
 * Boundary: a type only; `resolveSeo` builds it and the route adapter turns it into tags. `jsonLd` holds escaped
 *           strings, so an adapter can only write structured data that went through the escaper.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decisions 4 and 7).
 */

/** The resolved head of one page. */
export interface ResolvedSeo {
  /** The title after the template. */
  readonly title: string;
  /** The description, when any link set one. */
  readonly description: string | undefined;
  /** The absolute canonical URL. */
  readonly canonical: string;
  /** hreflang to absolute URL, `x-default` included; empty when hreflang is off. */
  readonly alternates: Readonly<Record<string, string>>;
  /** The absolute Open Graph image URL, when any. */
  readonly image: string | undefined;
  /** The Open Graph type. */
  readonly type: string;
  /** Whether the page stays out of search. */
  readonly noindex: boolean;
  /** The site name (`og:site_name`). */
  readonly siteName: string;
  /** Each JSON-LD block, serialised by `serializeJsonLd`; empty when JSON-LD is off. */
  readonly jsonLd: readonly string[];
}

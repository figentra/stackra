/**
 * Stackra file contract:
 * Purpose: `OgCard`, everything one Open Graph image shows: its template (an `OgKind` code), its size, the title, the
 *          site name, the text direction, the site's colours, the logo mark and an optional picture (a product's
 *          first image).
 * Boundary: a type only, in the leaf entry so the `OgRenderer` port can name it. `brand` takes the tenant's colour
 *           roles as the theming tokens carry them; only `accent` and `accent-foreground` are read, and only as
 *           `#RRGGBB(AA)` hex. `logo` is SVG markup (`logo.svg?raw`), never a URL.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decision 7: the derived Open Graph image); ADR 0302 (colour tokens).
 */

/** One Open Graph card. */
export interface OgCard {
  /** The card template: an `OgKind` code (`site`, `page`, `product`). */
  readonly template: string;
  /** The image width in pixels. */
  readonly width: number;
  /** The image height in pixels. */
  readonly height: number;
  /** The headline: the page or product title. */
  readonly title: string;
  /** The site's name, shown beside the logo. */
  readonly siteName: string;
  /** The text direction of the site's locale. */
  readonly dir: "ltr" | "rtl";
  /** The site's colour roles; `accent` is the background and `accent-foreground` the text. */
  readonly brand: Readonly<Record<string, { readonly hexLight: string } | undefined>>;
  /** The logo mark as SVG markup; empty for none. */
  readonly logo: string;
  /** An absolute `https:` URL of a picture shown beside the title. */
  readonly image?: string | undefined;
}

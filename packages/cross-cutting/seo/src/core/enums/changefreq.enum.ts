/**
 * Stackra file contract:
 * Purpose: `Changefreq`, how often the pages of a sitemap source change: the `<changefreq>` value of every URL the
 *          source lists (`SitemapSource.changefreq`).
 * Boundary: an `Enum.of` value plus the type of the same name. The codes are the sitemap protocol's own words, so
 *           `writeSitemap` writes them unchanged. A hint to crawlers, never a promise.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decision 2); ADR 0294 (decision 16: the Enum row); the sitemaps.org protocol 0.9.
 */
import { Enum } from "@stackra/contracts";

/** How often a source's pages change. */
export const Changefreq = Enum.of({
  /** Changes on every request. */
  Always: "always",
  /** Changes about every hour. */
  Hourly: "hourly",
  /** Changes about every day: a catalogue. */
  Daily: "daily",
  /** Changes about every week: marketing pages and builder pages. */
  Weekly: "weekly",
  /** Changes about every month. */
  Monthly: "monthly",
  /** Changes about every year. */
  Yearly: "yearly",
  /** Archived: never changes again. */
  Never: "never",
});

/** One of the codes above. */
export type Changefreq = Enum.Value<typeof Changefreq>;

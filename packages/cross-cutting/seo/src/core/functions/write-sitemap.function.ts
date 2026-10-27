/**
 * Stackra file contract:
 * Purpose: `writeSitemap`, one sitemap file as XML: a `<url>` per entry with its location, last change, change
 *          frequency, an `xhtml:link` per hreflang alternate and an `image:image` per image.
 * Boundary: a pure function over absolute URLs; every value is escaped. It refuses a file above the protocol limits
 *           (50,000 URLs, 50 MB) instead of writing one crawlers drop; the paging keeps a page within them. An empty
 *           list is a valid empty sitemap.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decision 2); the sitemaps.org protocol 0.9; Google's image and hreflang extensions.
 */
import { escapeXml } from "@stackra/support";

import { checkSitemapLimits } from "#core/functions/check-sitemap-limits.function";
import type { SitemapEntry } from "#core/types/sitemap-entry.type";

/** The opening of a sitemap file with the three namespaces it uses. */
const OPEN =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' +
  ' xmlns:xhtml="http://www.w3.org/1999/xhtml"' +
  ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

/** One entry as its `<url>` element. */
function urlElement(entry: SitemapEntry): string {
  const lines = [`  <url>`, `    <loc>${escapeXml(entry.loc)}</loc>`];
  if (entry.lastmod !== undefined) {
    const lastmod = entry.lastmod instanceof Date ? entry.lastmod.toISOString() : entry.lastmod;
    lines.push(`    <lastmod>${escapeXml(lastmod)}</lastmod>`);
  }
  if (entry.changefreq !== undefined)
    lines.push(`    <changefreq>${escapeXml(entry.changefreq)}</changefreq>`);
  for (const [hreflang, href] of Object.entries(entry.alternates ?? {})) {
    lines.push(
      `    <xhtml:link rel="alternate" hreflang="${escapeXml(hreflang)}" href="${escapeXml(href)}"/>`,
    );
  }
  for (const image of entry.images ?? []) {
    lines.push(`    <image:image><image:loc>${escapeXml(image)}</image:loc></image:image>`);
  }
  lines.push(`  </url>`);
  return lines.join("\n");
}

/**
 * The XML of one sitemap file.
 *
 * @example
 * new Response(writeSitemap([{ loc: "https://acme.test/pricing", changefreq: Changefreq.Weekly }]), {
 *   headers: { "Content-Type": "application/xml; charset=utf-8" },
 * });
 * @throws RangeError when the entries exceed 50,000 URLs or the file 50 MB.
 * @throws TypeError when a value holds a character XML cannot carry.
 */
export function writeSitemap(entries: readonly SitemapEntry[]): string {
  const body = entries.map(urlElement).join("\n");
  return checkSitemapLimits(`${OPEN}${body}${body ? "\n" : ""}</urlset>\n`, entries.length);
}

/**
 * Stackra file contract:
 * Purpose: `sitemapFiles`, every file the sitemap index lists: for each source, in the record's order, as many
 *          numbered pages as its items need at `pageSize` per file, and always at least page 1.
 * Boundary: counts each source by walking its cursors once (in parallel across sources); keeps no items. Only the
 *           record's own keys are sources. The sitemap index route writes the URLs.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decision 2).
 */
import { walkSitemapSource } from "#core/functions/walk-sitemap-source.function";
import type { SitemapContext } from "#core/types/sitemap-context.type";
import type { SitemapFile } from "#core/types/sitemap-file.type";
import type { SitemapSource } from "#core/types/sitemap-source.type";

/**
 * The numbered files of every source.
 *
 * @example
 * const files = await sitemapFiles(sitemapSources, { clients, site, href, pageSize: 5_000 });
 * writeSitemapIndex(files.map(({ source, page }) => `${site.origin}/sitemaps/${source}-${page}.xml`));
 * @throws RangeError when the page size is not a whole number from 1 to 50,000.
 */
export async function sitemapFiles<Clients>(
  sources: Readonly<Record<string, SitemapSource<Clients>>>,
  context: SitemapContext<Clients>,
): Promise<SitemapFile[]> {
  const counts = await Promise.all(
    Object.keys(sources).map(async (name) => {
      let count = 0;
      const source = sources[name];
      if (source !== undefined) {
        await walkSitemapSource(source, context, (items) => {
          count += items.length;
          return true;
        });
      }
      return { name, count };
    }),
  );
  return counts.flatMap(({ name, count }) => {
    const pages = Math.max(1, Math.ceil(count / context.pageSize));
    return Array.from({ length: pages }, (_, index) => ({ source: name, page: index + 1 }));
  });
}

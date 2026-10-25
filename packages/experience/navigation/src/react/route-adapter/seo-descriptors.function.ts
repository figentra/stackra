/**
 * Stackra file contract:
 * Purpose: `seoDescriptors(seo)`, a resolved head as React Router meta descriptors: the title, the description, the
 *          canonical and hreflang links, the Open Graph tags, `robots: noindex` and each JSON-LD block.
 * Boundary: internal to `routeAdapter`. JSON-LD is handed to React Router's `script:ld+json`, which escapes it on
 *           output; nothing is written as raw HTML here.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decisions 4 and 7); ADR 0297.
 */
import type { ResolvedSeo } from "@stackra/seo";
import type { MetaDescriptor } from "react-router";

/**
 * The meta descriptors of `seo`.
 *
 * @example
 * export const meta: Route.MetaFunction = (args) => seoDescriptors(args.loaderData?.seo);
 */
export function seoDescriptors(seo: ResolvedSeo | null | undefined): MetaDescriptor[] {
  if (seo === null || seo === undefined) return [];
  const tags: MetaDescriptor[] = [
    { title: seo.title },
    { tagName: "link", rel: "canonical", href: seo.canonical },
    { property: "og:title", content: seo.title },
    { property: "og:type", content: seo.type },
    { property: "og:url", content: seo.canonical },
    { property: "og:site_name", content: seo.siteName },
  ];
  if (seo.description !== undefined)
    tags.push(
      { name: "description", content: seo.description },
      { property: "og:description", content: seo.description },
    );
  if (seo.image !== undefined) tags.push({ property: "og:image", content: seo.image });
  if (seo.noindex) tags.push({ name: "robots", content: "noindex" });
  for (const [hrefLang, href] of Object.entries(seo.alternates))
    tags.push({ tagName: "link", rel: "alternate", hrefLang, href });
  for (const block of seo.jsonLd) tags.push({ "script:ld+json": JSON.parse(block) as object });
  return tags;
}

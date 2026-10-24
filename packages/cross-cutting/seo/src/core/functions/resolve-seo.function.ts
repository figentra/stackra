/**
 * Stackra file contract:
 * Purpose: `resolveSeo`, the one SEO chain of a route: the links in order (the app's defaults, the route's static
 *          `seo`, the route's `meta()`, then the tenant's SEO record), each defined field replacing the earlier one,
 *          then the derived fields: the templated title, the canonical URL, the alternates, the site name and the
 *          Open Graph image. The route adapter calls it for every head.
 * Boundary: a pure function. A non-indexable site (a preview host, a sandbox tenant) is `noindex` whatever a link
 *           says. JSON-LD comes out escaped by `serializeJsonLd`, so the adapter cannot write it raw. `hreflang` and
 *           `jsonLd` off in the config leave those fields empty. The page title is inserted literally: a `$` or
 *           `{siteName}` inside it is not a pattern.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decisions 4 and 7); ADR 0116 (the tenant's SEO fields).
 */
import type { SeoConfig } from "#config/seo.config";
import { serializeJsonLd } from "#core/functions/serialize-json-ld.function";
import type { ResolvedSeo } from "#core/types/resolved-seo.type";
import type { Seo } from "#core/types/seo.type";

/**
 * The head of one page.
 *
 * @example
 * resolveSeo([defaults, route.seo, route.meta(ctx), tenantRecord], {
 *   name: site.name, canonical: url, alternates: alternates(ctx, path), image: siteCard, indexable: site.indexable,
 * }, ctx.config(SeoConfig));
 * @param chain - the links in chain order; a missing link is `undefined`.
 * @param site - what is derived: the site name, the canonical URL, the alternates, the default image, indexability.
 * @param config - the title template and whether heads carry hreflang and JSON-LD.
 */
export function resolveSeo(
  chain: readonly (Seo | undefined)[],
  site: {
    readonly name: string;
    readonly canonical: string;
    readonly alternates: Readonly<Record<string, string>>;
    readonly image?: string | undefined;
    readonly indexable: boolean;
  },
  config: Pick<SeoConfig, "titleTemplate" | "hreflang" | "jsonLd">,
): ResolvedSeo {
  /** The field's value in the last link that defines it. */
  const latest = <Field extends keyof Seo>(field: Field): Seo[Field] | undefined => {
    let value: Seo[Field] | undefined;
    for (const link of chain) if (link?.[field] !== undefined) value = link[field];
    return value;
  };
  const pageTitle = latest("title");
  const title =
    pageTitle === undefined || pageTitle === ""
      ? site.name
      : config.titleTemplate
          .split("%s")
          .map((part) => part.replaceAll("{siteName}", site.name))
          .join(pageTitle);
  return {
    title,
    description: latest("description"),
    canonical: latest("canonical") ?? site.canonical,
    alternates: config.hreflang ? site.alternates : {},
    image: latest("image") ?? site.image,
    type: latest("type") ?? "website",
    noindex: !site.indexable || latest("noindex") === true,
    siteName: site.name,
    jsonLd: config.jsonLd ? (latest("jsonLd") ?? []).map((block) => serializeJsonLd(block)) : [],
  };
}

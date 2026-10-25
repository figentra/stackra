/**
 * Stackra file contract:
 * Purpose: `routeSeo(type, instance, run, data, t)`, the resolved head of one page, run on the server inside the
 *          loader: the route's static `seo` (its title and description keys translated), then its `meta(ctx)`, through
 *          `resolveSeo` of `@stackra/seo` with the site's name, canonical URL, hreflang alternates and indexability.
 * Boundary: internal to `routeAdapter`. The site is the layout's `site` data when it has one (`name`, `origin`,
 *           `indexable`), else the request's origin; without a container (no `SeoConfig`) there is no head to resolve
 *           and the app's defaults stand.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (the SEO chain; decisions 4 to 7); ADR 0297 (decision 4).
 */
import type { AnyClass } from "@stackra/container";
import { kindOf } from "@stackra/container";
import type { Locale } from "@stackra/i18n";
import { alternates, resolveSeo, SeoConfig, type ResolvedSeo, type Seo } from "@stackra/seo";

import type { Route } from "#core/bases/route.base";
import type { MetaContext } from "#core/types/meta-context.type";
import type { RouteRun } from "#react/route-run/route-run.type";

/** `value` as a record, or an empty one. */
const recordOf = (value: unknown): Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

/**
 * The head of the page `instance` renders for `run`.
 *
 * @example
 * const seo = routeSeo(ProductRoute, instance, run, data, translatorFor);
 */
export function routeSeo(
  type: AnyClass,
  instance: Route,
  run: RouteRun,
  data: unknown,
  translatorFor: (
    locale: Locale,
  ) => (key: string, values?: Readonly<Record<string, unknown>>) => string,
): ResolvedSeo | null {
  const { ctx, container } = run;
  const t = translatorFor(ctx.locale);
  const recorded = kindOf(type)?.options["seo"] as Seo | null | undefined;
  const fixed: Seo | undefined =
    recorded === null || recorded === undefined
      ? undefined
      : {
          ...recorded,
          title: recorded.title === undefined ? undefined : t(recorded.title),
          description: recorded.description === undefined ? undefined : t(recorded.description),
        };
  const metaCtx = {
    ...recordOf(run.layoutData),
    data,
    params: ctx.params,
    search: ctx.search,
    t,
    href: ctx.href,
  } as unknown as MetaContext<Route>;
  const own = instance.meta(metaCtx);
  if (container === undefined) return null;
  const site = recordOf(recordOf(run.layoutData)["site"]);
  const url = new URL(ctx.request.url);
  const origin =
    typeof site["origin"] === "string" ? site["origin"].replace(/\/+$/, "") : url.origin;
  return resolveSeo(
    [fixed, own],
    {
      name: typeof site["name"] === "string" ? site["name"] : "",
      canonical: `${origin}${url.pathname}`,
      alternates: alternates(
        { site: { origin }, config: (token) => container.get(token) },
        url.pathname,
      ),
      indexable: site["indexable"] !== false,
    },
    container.get(SeoConfig),
  );
}

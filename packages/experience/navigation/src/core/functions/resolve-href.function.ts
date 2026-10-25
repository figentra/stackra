/**
 * Stackra file contract:
 * Purpose: `resolveHref(target, params?, mount?)`, the one place a link target becomes an href: a route ref through its
 *          registered class's path with the params filled in, a settings page at `/settings/<key-kebab>`, an object's
 *          `path` or `base`; then the locale mount's prefix (`/ar-sa/pricing`) and the query and fragment. Every link,
 *          redirect, menu entry and navigation item resolves through it.
 * Boundary: a string target is already an href and is only given the query and fragment. The prefix follows
 *           `localePath` of `@stackra/seo` (ADR 0297: lowercase tags, the default locale unprefixed); without a mount
 *           the path stays unprefixed.
 * Runtime: isomorphic
 * Governing contract: ADR 0297 (decision 4); ADR 0294 (decision 20); ADR 0307 (rule 24: settings pages).
 */
import { kindOf } from "@stackra/container";
import type { I18nConfig, Locale } from "@stackra/i18n";
import { localePath } from "@stackra/seo";

import { ROUTE_TABLE } from "#core/constants/route-table.constant";
import { fillPath } from "#core/functions/fill-path.function";
import type { HrefParams } from "#core/types/href-params.type";
import type { RouteTarget } from "#core/types/route-target.type";

/** The path of a non-string target, params filled in. */
function pathOf(target: Exclude<RouteTarget, string>, params: HrefParams): string {
  if ("fields" in target && "key" in target) return `/settings/${target.key.replaceAll("_", "-")}`;
  if ("path" in target) return target.path;
  if ("base" in target) return target.base;
  const type = ROUTE_TABLE.get(target.name);
  if (type === undefined)
    throw new RangeError(`No route is registered under "${target.name}" (registerRoutes)`);
  const pattern = kindOf(type)?.options["path"];
  if (typeof pattern !== "string")
    throw new RangeError(`The route "${target.name}" has no path to link to`);
  return fillPath(pattern, params);
}

/** `href` with the query and fragment of `params`. */
function withQuery(href: string, params: HrefParams): string {
  const query = new URLSearchParams();
  for (const [name, value] of Object.entries(params.search ?? {}))
    if (value !== undefined) query.append(name, String(value));
  const text = query.toString();
  const search = text === "" ? "" : `${href.includes("?") ? "&" : "?"}${text}`;
  const hash = params.hash === undefined || params.hash === "" ? "" : `#${params.hash}`;
  return `${href}${search}${hash}`;
}

/**
 * The href of `target`.
 *
 * @param mount - the locale mount to prefix the path with, and the i18n configuration that names the locales.
 * @throws RangeError when a route ref's key is not registered, its route has no path, or a required param is missing.
 * @example
 * resolveHref(Routes.product, { slug: "tee" }, { locale: Locale.ArSa, i18n }); // "/ar-sa/store/tee"
 * resolveHref(Routes.store, { search: { collection: "summer" } }); // "/store?collection=summer"
 */
export function resolveHref(
  target: RouteTarget,
  params: HrefParams = {},
  mount?: {
    readonly locale: Locale;
    readonly i18n: Pick<I18nConfig, "locales" | "defaultLocale" | "urlStrategy">;
  },
): string {
  if (typeof target === "string") return withQuery(target, params);
  const path = pathOf(target, params);
  return withQuery(mount === undefined ? path : localePath(path, mount.locale, mount.i18n), params);
}

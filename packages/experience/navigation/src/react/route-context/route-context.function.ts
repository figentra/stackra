/**
 * Stackra file contract:
 * Purpose: `routeContext(args, keys)`, the context of a generated resource route module from React Router's arguments
 *          and the request's context keys: `ctx.locale`, `ctx.config(SeoConfig)`, `await ctx.layout(SiteLayout)`,
 *          `ctx.query(...)`, `ctx.clients`, `ctx.href(...)`.
 * Boundary: reads the context lazily: a member that needs the container or the clients throws a `TypeError` naming the
 *           missing key only when used. A layout's data is shared with the route modules of the same request.
 * Runtime: isomorphic
 * Governing contract: ADR 0297 (web runtime); ADR 0301; ADR 0165 (framework mode).
 */
import type { AnyClass } from "@stackra/container";
import { I18nConfig, Locale } from "@stackra/i18n";

import type { Layout } from "#core/bases/layout.base";
import { localeOfPath } from "#core/functions/locale-of-path.function";
import { resolveHref } from "#core/functions/resolve-href.function";
import type { LoaderData } from "#core/types/loader-data.type";
import type { RouteModuleContext } from "#react/route-context/route-module-context.type";
import type { RouteKeys } from "#react/route-keys/route-keys.type";
import { layoutDataOf } from "#react/route-run/layout-data-of.function";
import { routeBaseOf, type RouterArgs } from "#react/route-run/route-base-of.function";

/**
 * The context of one request to a resource route module.
 *
 * @example
 * const ctx = routeContext(args, routeKeys);
 * const { site } = await ctx.layout(SiteLayout);
 */
export function routeContext(args: RouterArgs, keys: RouteKeys): RouteModuleContext {
  const { base, container, clients } = routeBaseOf(args, keys);
  const i18n = container?.has(I18nConfig) === true ? container.get(I18nConfig) : undefined;
  const locale =
    i18n === undefined ? Locale.En : localeOfPath(new URL(args.request.url).pathname, i18n);
  const mount = i18n === undefined ? undefined : { locale, i18n };
  return {
    locale,
    get clients() {
      return clients();
    },
    config: <C extends object>(type: AnyClass<C>) => {
      if (container === undefined)
        throw new TypeError("ctx.config needs the container (the container context key)");
      return container.get(type);
    },
    layout<L extends AnyClass<Layout>>(layout: L) {
      return layoutDataOf(layout, base) as Promise<
        Exclude<LoaderData<InstanceType<L>>, null | undefined>
      >;
    },
    query: (query, input) => clients().query(query, input, { signal: args.request.signal }),
    href: (to, params) => resolveHref(to, params, mount),
  };
}

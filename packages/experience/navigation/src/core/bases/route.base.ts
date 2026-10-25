/**
 * Stackra file contract:
 * Purpose: `Route`, the kind base of a route: `class DashboardRoute extends Route({ path: "/", layout: ShellLayout })`
 *          in an app's `routes/<name>/<name>.route.ts`, its page `<name>.tsx` beside it bound by name. The class is
 *          static options plus behaviour: `loader(ctx)` reads what the page shows, `submit(ctx)` handles its form,
 *          `meta(ctx)` adds the head that depends on the data. The interface of the same name is its instance side.
 * Boundary: called only. The call checks the options and records them in the kind registry with the defaults filled
 *           in (`auth: true`, `presentation: push`); the adapters, `registerRoutes`, `resolveHref` and gen read them
 *           through `kindOf`. `loader`, `submit` and `meta` are declared here, so an author writes `override`; the base
 *           versions return no data, nothing and an empty head. The route key and the title of a route that sets none
 *           are derived by gen. Dependencies arrive through the constructor.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 14, 16, 17 and 25); ADR 0305 (rules 2 and 3); registry v3.1 (kind-base
 *                     ownership: Route, Layout, Menu are navigation's).
 */
import { createKind } from "@stackra/container";
import type { Seo } from "@stackra/seo";

import { Presentation } from "#core/enums/presentation.enum";
import type { MetaContext } from "#core/types/meta-context.type";
import type { RouteClass } from "#core/types/route-class.type";
import type { RouteContext } from "#core/types/route-context.type";
import type { RouteOptions } from "#core/types/route-options.type";

/** The instance side of every route class. */
export interface Route<O extends RouteOptions = RouteOptions> {
  /** Type-only kind brand, so a class of another kind cannot stand in for a route. */
  readonly "~kind": "route";

  /** Type-only: the options the class was declared with, read by `RouteContext`, `RouteProps` and `InferParams`. */
  readonly "~options": O;

  /** What the page shows; a redirect (`ctx.redirect`) or a thrown `ctx.notFound()` instead of data. */
  loader(ctx: RouteContext<this>): unknown;

  /** Handles the page's form: field errors, data for the page, or a redirect. */
  submit(ctx: RouteContext<this>): unknown;

  /** The head that depends on the loader's data, over the static `seo`. */
  meta(ctx: MetaContext<this>): Seo;
}

/**
 * Checks `options` and fills in the defaults.
 *
 * @throws RangeError when `path` is neither `*` nor absolute, `tab.order` is not a whole number from 1, or `status`
 *         is not an HTTP status.
 */
function readRouteOptions(options: RouteOptions): Readonly<Record<string, unknown>> {
  const { path, tab, status } = options;
  if (path !== undefined && path !== "*" && !path.startsWith("/"))
    throw new RangeError(`A route path is absolute or "*", not "${path}"`);
  if (tab !== undefined && (!Number.isInteger(tab.order) || tab.order < 1))
    throw new RangeError(`A tab order is a whole number from 1, not ${String(tab.order)}`);
  if (status !== undefined && (!Number.isInteger(status) || status < 100 || status > 599))
    throw new RangeError(`A route status is an HTTP status, not ${String(status)}`);
  return {
    path: path ?? null,
    layout: options.layout ?? null,
    title: options.title ?? null,
    tab: tab === undefined ? null : Object.freeze({ ...tab }),
    auth: options.auth ?? true,
    permission: options.permission ?? null,
    flag: options.flag ?? null,
    capability: Object.freeze({ ...options.capability }),
    status: status ?? null,
    params: options.params ?? null,
    search: options.search ?? null,
    seo: options.seo === undefined ? null : Object.freeze({ ...options.seo }),
    render: options.render ?? null,
    prerender: options.prerender ?? false,
    presentation: options.presentation ?? Presentation.Push,
    chrome: Object.freeze({ ...options.chrome }),
    document: options.document ?? null,
    cache: options.cache === undefined ? null : Object.freeze({ ...options.cache }),
  };
}

/**
 * The route kind base.
 *
 * @example
 * export class ShareRoute extends Route({ path: "/share", layout: ShellLayout, title: I18n.pages.share.title }) {
 *   override async loader(ctx: RouteContext<this>) {
 *     const id = ctx.search.shared;
 *     return { shared: id ? await ctx.platform.shareTarget.take(id) : null };
 *   }
 * }
 */
export const Route = createKind(
  "route",
  class RouteBase {
    /** No data. */
    loader(): unknown {
      return null;
    }

    /** Nothing to hand back. */
    submit(): unknown {
      return null;
    }

    /** No head of its own. */
    meta(): Seo {
      return {};
    }
  },
  readRouteOptions,
) as <const O extends RouteOptions>(options: O) => RouteClass<O>;

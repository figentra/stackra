/**
 * Stackra file contract:
 * Purpose: `RouteModuleContext`, what `routeContext(args, keys)` gives a generated resource route module (`robots.txt`,
 *          the sitemaps, the Open Graph images, the document root's loader): the mount's locale, the container's
 *          configs, a layout's data for this request, the request's public clients and `query`, and `href`.
 * Boundary: a type only. A resource route has no route class, so this is not a `RouteContext`.
 * Runtime: isomorphic
 * Governing contract: ADR 0297 (web runtime on Workers); ADR 0301 (robots, sitemaps, Open Graph).
 */
import type { QueryRef, RefInput, RefOutput } from "@stackra/clients";
import type { PublicClients } from "@stackra/clients/server";
import type { AnyClass } from "@stackra/container";
import type { Locale } from "@stackra/i18n";

import type { Layout } from "#core/bases/layout.base";
import type { ClassInstance } from "#core/types/class-instance.type";
import type { HrefParams } from "#core/types/href-params.type";
import type { LoaderData } from "#core/types/loader-data.type";
import type { RouteQueryOptions } from "#core/types/route-query-options.type";
import type { RouteTarget } from "#core/types/route-target.type";

/** The context of a resource route module. */
export interface RouteModuleContext {
  /** The locale of the request's mount. */
  readonly locale: Locale;

  /** The request's public clients. */
  readonly clients: Pick<PublicClients, "query" | "action">;

  /** A configuration from the container. */
  config: <C extends object>(type: AnyClass<C>) => C;

  /**
   * What `layout`'s loader resolved for this request (one run per request).
   *
   * @throws Response the layout's redirect or response.
   */
  layout: <L extends AnyClass<Layout>>(
    layout: L,
  ) => Promise<Exclude<LoaderData<ClassInstance<L>>, null | undefined>>;

  /** The answer of a consumed public query. */
  query: <Q extends QueryRef>(
    query: Q,
    input: RefInput<Q>,
    options?: RouteQueryOptions,
  ) => Promise<RefOutput<Q>>;

  /** The localised href of `to`. */
  href: (to: RouteTarget, params?: HrefParams) => string;
}

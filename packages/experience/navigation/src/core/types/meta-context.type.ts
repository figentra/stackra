/**
 * Stackra file contract:
 * Purpose: `MetaContext<T>`, what a route's `meta(ctx)` receives: its loader's data, the request's translator `t`,
 *          `href` for absolute URLs in structured data, the params and query, and the data its layout resolved
 *          (`site`).
 * Boundary: a type only; the web adapter builds it on the server, so `meta` reads no request or service.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (the SEO chain); ADR 0294 (decision 16).
 */
import type { HrefParams } from "#core/types/href-params.type";
import type { LayoutData } from "#core/types/layout-data.type";
import type { LoaderData } from "#core/types/loader-data.type";
import type { ParamsOf } from "#core/types/params-of.type";
import type { RouteTarget } from "#core/types/route-target.type";
import type { SearchOf } from "#core/types/search-of.type";

/** The context of a route's `meta`. */
export type MetaContext<T> = {
  /** What the route's loader returned. */
  readonly data: LoaderData<T>;

  /** The path params. */
  readonly params: ParamsOf<T>;

  /** The query. */
  readonly search: SearchOf<T>;

  /** Translates a key in the request's locale. */
  t(key: string, values?: Readonly<Record<string, unknown>>): string;

  /** The localised href of `to`, relative to the origin. */
  href(to: RouteTarget, params?: HrefParams): string;
} & LayoutData<T>;

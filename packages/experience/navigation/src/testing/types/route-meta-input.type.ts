/**
 * Stackra file contract:
 * Purpose: `RouteMetaInput`, what a test hands `routeMeta`: the loader's `data`, the container holding `SeoConfig`
 *          (and `I18nConfig` for the hreflang alternates), the request's path, an optional translator, and the
 *          layout's data as members (`site`).
 * Boundary: a type only; every member that is not an option reaches `meta(ctx)` as layout data, as the web adapter
 *           spreads the layout's data there.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0301 (the SEO chain); the template's `routeMeta` tests.
 */
import type { RouteLoaderInput } from "#testing/types/route-loader-input.type";

/** The inputs of one head resolution. */
export interface RouteMetaInput extends RouteLoaderInput {
  /** What the route's loader returned. */
  readonly data: unknown;

  /** Translates a key for the static title and description and `meta`'s `t`; the key itself when left out. */
  readonly t?: (key: string, values?: Readonly<Record<string, unknown>>) => string;
}

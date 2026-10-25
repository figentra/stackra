/**
 * Stackra file contract:
 * Purpose: `RouteLoaderInput`, what a test hands `runRouteLoader` (and the other route helpers): the request URL, path
 *          and query, the params, the locale, the layout's data, the container, the testing parts of this call
 *          (`services`), and any context member's starting state (`session`, `storage`), which a testing part turns
 *          into its fake or which is passed to the context as given.
 * Boundary: a type only; open by its index signature, so a member another package contributes needs no change here.
 *           `services` takes another package's testing part for one call without this package importing it.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); the template's route and layout tests
 *                     (`runRouteLoader(TabsLayout, { session })`).
 */
import type { Container } from "@stackra/container";
import type { Locale } from "@stackra/i18n";

import type { RouteTestingPart } from "#testing/types/route-testing-part.type";

/** The starting state of one loader run. */
export interface RouteLoaderInput {
  /** The request URL; `http://localhost/` when left out. A `path` is resolved against it. */
  readonly url?: string;

  /** The requested path with its query (`/orders?status=paid`), against `url`'s origin. */
  readonly path?: string;

  /** Query entries added to the request URL (`{ returnTo: "/settings" }`). */
  readonly search?: Readonly<Record<string, string>>;

  /** The path params. */
  readonly params?: Readonly<Record<string, unknown>>;

  /** The locale of the mount; `en` when left out. */
  readonly locale?: Locale;

  /** The layout's data, spread into the context. */
  readonly layoutData?: unknown;

  /** The container the route is built from and `ctx.config`, `ctx.platform` and `ctx.settings` read. */
  readonly container?: Container;

  /** Testing parts for this call only, run after the registered ones (tenancy's or settings' test helper). */
  readonly services?: readonly RouteTestingPart[];

  /** A context member's starting state (`session`, `storage`). */
  readonly [member: string]: unknown;
}

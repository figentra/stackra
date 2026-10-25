/**
 * Stackra file contract:
 * Purpose: `RouteContextInput`, what an adapter hands `createRouteContext` for one load or submit: the route or layout
 *          class, the request and its matched params, the container and the caller, the layout's data, extra members,
 *          and how to leave the app.
 * Boundary: a type only; the react, native and testing adapters fill it from their router.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 17).
 */
import type { AnyClass, Container } from "@stackra/container";
import type { Locale } from "@stackra/i18n";

import type { RouteCaller } from "#contracts/index";

/** The inputs of one route context. */
export interface RouteContextInput {
  /** The route or layout class whose options type `params` and `search`. */
  readonly type: AnyClass;

  /** The request being loaded or submitted. */
  readonly request: Request;

  /** The params the router matched (or the native screen received). */
  readonly params?: Readonly<Record<string, unknown>> | undefined;

  /** The container the route runs in; config, platform, captcha, settings and the caller come from it. */
  readonly container?: Container | undefined;

  /** The caller of `query` and `action`; the container's `RouteCaller` when left out. */
  readonly caller?: Pick<RouteCaller, "query" | "action"> | undefined;

  /** The locale of the mount; read from the path and `I18nConfig` when left out. */
  readonly locale?: Locale | undefined;

  /** The layout's data, spread into the context when it is an object. */
  readonly layoutData?: unknown;

  /** Extra members (the member's env, a test's input), applied last. */
  readonly members?: Readonly<Record<string, unknown>> | undefined;

  /** Leaves for `href`; a redirect inside the app, `location.assign` outside, when left out. */
  readonly navigate?: ((href: string, options: { readonly external: boolean }) => void) | undefined;
}

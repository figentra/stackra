/**
 * Stackra file contract:
 * Purpose: `RenderRouteOptions`, what a test hands `renderRoute` and `renderLayout`: everything a loader run takes
 *          (the mount `path`, params, members, `services`), the page to mount when gen's route table did not bind one,
 *          and the providers and wrapper of `@stackra/testing/react`'s `render`.
 * Boundary: a type only. The providers are the caller's: this package adds none, so tenancy's, i18n's or the
 *           container's test providers come in through `providers`.
 * Runtime: browser (vitest, jsdom)
 * Governing contract: ADR 0269 (decisions 3 and 6).
 */
import type { RenderOptions } from "@stackra/testing/react";
import type { ComponentType } from "react";

import type { RouteLoaderInput } from "#testing/types/route-loader-input.type";

/** The options of one mounted route or layout. */
export interface RenderRouteOptions extends RouteLoaderInput {
  /** The page (or layout component); the page `registerRoutes` bound to the route when left out. */
  readonly component?: ComponentType<never>;

  /** Providers around the router stub, the first outermost. */
  readonly providers?: RenderOptions["providers"];

  /** Wraps the router stub, inside every provider. */
  readonly wrapper?: RenderOptions["wrapper"];
}

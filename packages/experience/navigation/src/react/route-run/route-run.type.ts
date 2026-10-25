/**
 * Stackra file contract:
 * Purpose: `RouteRun`, one load or submit as the React Router adapters prepare it: the context, the container and the
 *          error reporter read from the request's context keys, the layout's data, and the base inputs a layout run
 *          of the same request reuses.
 * Boundary: a type only, internal to `./react`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16); ADR 0165.
 */
import type { Container } from "@stackra/container";
import type { ErrorReporter } from "@stackra/errors/contracts";

import type { Route } from "#core/bases/route.base";
import type { RouteContext } from "#core/types/route-context.type";
import type { RouteContextInput } from "#core/types/route-context-input.type";

/** A prepared load or submit. */
export interface RouteRun {
  /** The route's context. */
  readonly ctx: RouteContext<Route>;

  /** The container, when the request carries one. */
  readonly container: Container | undefined;

  /** Where an unexpected error is reported, when anything is bound. */
  readonly reporter: ErrorReporter | undefined;

  /** What the route's layout resolved; `undefined` without a layout. */
  readonly layoutData: unknown;

  /** The inputs every context of this request shares. */
  readonly base: Omit<RouteContextInput, "type" | "layoutData">;
}

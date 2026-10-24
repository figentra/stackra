/**
 * Stackra file contract:
 * Purpose: `HydrateRoutePart`, one level `hydrateRoute` renders: the route or layout class (its options and behaviour,
 *          resolved from the container) and the page or frame component gen compiled from its class component.
 * Boundary: a type only. The component is typed as the authored class or a function, since gen compiles a class
 *           component to a function before the bundle runs.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 37 to 41: class components); ADR 0294 (decision 14: routes).
 */
import type { AnyClass } from "@stackra/container";
import type { FunctionComponent } from "react";

/** One route or layout and its component. */
export interface HydrateRoutePart {
  /** The `Route` or `Layout` class, as the wiring binds it. */
  readonly class: AnyClass;

  /** The component rendered for it. */
  readonly component: AnyClass | FunctionComponent<never>;
}

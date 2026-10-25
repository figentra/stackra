/**
 * Stackra file contract:
 * Purpose: `RouteTestingPart`, how another package's testing setup takes part in the route helpers without this
 *          package importing it: identity fakes `session`, tenancy fakes its switcher, gen's test setup builds the route
 *          or layout from the member's wiring.
 * Boundary: a type only; called once per run (once per mount for `renderRoute`), so each starts from fresh fakes.
 *           Registered with `registerRouteTestingPart` from the part's own testing setup, which gen's vitest config
 *           loads, or passed for one call in the input's `services`.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3: a package never reaches into another package's `./testing`).
 */
import type { AnyClass } from "@stackra/container";

import type { RouteLoaderInput } from "#testing/types/route-loader-input.type";
import type { RouteTestingContribution } from "#testing/types/route-testing-contribution.type";

/** One package's share of every loader run in tests. */
export type RouteTestingPart = (run: {
  /** The route or layout class under test. */
  readonly type: AnyClass;
  /** The test's starting state. */
  readonly input: RouteLoaderInput;
}) => RouteTestingContribution | Promise<RouteTestingContribution>;

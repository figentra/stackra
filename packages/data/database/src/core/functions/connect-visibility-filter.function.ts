/**
 * Stackra file contract:
 * Purpose: `connectVisibilityFilter`, which names the resolver the reads take the `VisibilityFilter` driver and the
 *          running call's context (`ContextStorage`) from; the runtime calls it once at boot, the testing module on
 *          every compile.
 * Boundary: replaces the previous connection whole; `undefined` disconnects. A resolver that binds no
 *           `VisibilityFilter` leaves every read unchanged, so an app without record visibility pays nothing.
 * Runtime: node
 * Governing contract: ADR 0333 (decision 4); the `connectExtensions` precedent (ADR 0305 rules 23 and 25).
 */
import type { Resolver } from "@stackra/actions";

import { VISIBILITY_HOST } from "#core/constants/visibility-host.constant";

/**
 * Connects the reads to an app's visibility driver.
 *
 * @param resolver - the booted container or testing app, or `undefined` to disconnect.
 * @example
 * const container = await Container.create(wirings);
 * connectVisibilityFilter(container);
 */
export function connectVisibilityFilter(resolver: Resolver | undefined): void {
  VISIBILITY_HOST.resolver = resolver;
}

/**
 * Stackra file contract:
 * Purpose: `registerRouteTestingPart(name, part)`, the extension point of `runLoader`: a package's testing setup
 *          registers the part that fakes its context members, or builds the route, for every run of the process.
 * Boundary: test-process state only; registering the same name again replaces the part and moves it last. Returns the
 *           disposer that removes it.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3).
 */
import { ROUTE_TESTING_PARTS } from "#testing/constants/route-testing-parts.constant";
import type { RouteTestingPart } from "#testing/types/route-testing-part.type";

/**
 * Adds `part` to every `runLoader` of this process under `name`.
 *
 * @example
 * registerRouteTestingPart("@stackra/identity", ({ input }) => ({ context: { session: input["session"] ?? null } }));
 */
export function registerRouteTestingPart(name: string, part: RouteTestingPart): () => void {
  ROUTE_TESTING_PARTS.delete(name);
  ROUTE_TESTING_PARTS.set(name, part);
  return () => {
    if (ROUTE_TESTING_PARTS.get(name) === part) ROUTE_TESTING_PARTS.delete(name);
  };
}

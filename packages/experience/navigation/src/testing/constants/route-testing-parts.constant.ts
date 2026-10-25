/**
 * Stackra file contract:
 * Purpose: `ROUTE_TESTING_PARTS`, the testing parts registered for every route helper run of the test process, by name.
 * Boundary: test-process state; written by `registerRouteTestingPart`, read by `contributionsOf`.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3).
 */
import type { RouteTestingPart } from "#testing/types/route-testing-part.type";

/** Part name → part, in registration order. */
export const ROUTE_TESTING_PARTS = new Map<string, RouteTestingPart>();

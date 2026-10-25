/**
 * Stackra file contract:
 * Purpose: unit tests of `registerRoutes`: gen's route table and a plain key-to-class map both register, a table
 *          entry's page is kept for its route, and a bad key or a class that is not a route refuses the whole batch.
 * Boundary: test only; clears the route and page tables after each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decisions 20 and 22).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";

import { Route } from "#core/bases/route.base";
import { ROUTE_PAGE_TABLE } from "#core/constants/route-page-table.constant";
import { ROUTE_TABLE } from "#core/constants/route-table.constant";
import { registerRoutes } from "#core/functions/register-routes.function";

class HomeRoute extends Route({ path: "/" }) {}
class InboxRoute extends Route({ path: "/inbox" }) {}
/** A page component stand-in. */
const Home = () => null;

afterEach(() => {
  ROUTE_TABLE.clear();
  ROUTE_PAGE_TABLE.clear();
});

describe("registerRoutes", () => {
  it("registers gen's route table and a plain map", () => {
    registerRoutes({ home: { route: HomeRoute, page: Home }, inbox: InboxRoute });
    expect(ROUTE_TABLE.get("home")).toBe(HomeRoute);
    expect(ROUTE_TABLE.get("inbox")).toBe(InboxRoute);
  });

  it("keeps the page gen's table binds to a route, and none for a plain class", () => {
    registerRoutes({ home: { route: HomeRoute, page: Home }, inbox: InboxRoute });
    expect(ROUTE_PAGE_TABLE.get(HomeRoute)).toBe(Home);
    expect(ROUTE_PAGE_TABLE.has(InboxRoute)).toBe(false);
  });

  it("refuses the whole batch on a bad key or a class that is not a route", () => {
    expect(() => registerRoutes({ inbox: InboxRoute, "sign-in": HomeRoute })).toThrow(RangeError);
    class NotARoute {}
    expect(() => registerRoutes({ inbox: InboxRoute, other: NotARoute as never })).toThrow(
      TypeError,
    );
    expect(ROUTE_TABLE.size).toBe(0);
  });
});

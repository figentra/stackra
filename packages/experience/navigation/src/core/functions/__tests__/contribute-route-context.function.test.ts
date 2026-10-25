/**
 * Stackra file contract:
 * Purpose: unit tests of `contributeRouteContext`: a part's members reach every context built while it is contributed,
 *          the part reads the request, a later part wins a shared member, and the disposer removes only its own part.
 * Boundary: test only; clears the parts after each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decisions 17 and 23).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";

import { Route } from "#core/bases/route.base";
import { ROUTE_CONTEXT_PARTS } from "#core/constants/route-context-parts.constant";
import { contributeRouteContext } from "#core/functions/contribute-route-context.function";
import { createRouteContext } from "#core/functions/create-route-context.function";

class InboxRoute extends Route({ path: "/inbox" }) {}

/** The context's members as a record. */
const contextAt = (url: string) =>
  createRouteContext({ type: InboxRoute, request: new Request(url) }) as unknown as Record<
    string,
    unknown
  >;

afterEach(() => {
  ROUTE_CONTEXT_PARTS.clear();
});

describe("contributeRouteContext", () => {
  it("adds a part's members, read per request", () => {
    contributeRouteContext(({ request }) => ({ session: new URL(request.url).pathname }) as never);
    expect(contextAt("http://localhost/inbox")["session"]).toBe("/inbox");
  });

  it("lets a later part win and disposes only its own part", () => {
    const first = contributeRouteContext(() => ({ actor: "first" }) as never);
    const second = contributeRouteContext(() => ({ actor: "second" }) as never);
    expect(contextAt("http://localhost/")["actor"]).toBe("second");
    second();
    expect(contextAt("http://localhost/")["actor"]).toBe("first");
    first();
    expect(contextAt("http://localhost/")).not.toHaveProperty("actor");
  });
});

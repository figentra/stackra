/**
 * Stackra file contract:
 * Purpose: unit tests of `runRouteLoader` over the template's route and layout tests: a redirect comes back as
 *          `{ redirect, params }`, a registered testing part or one passed in `services` builds the instance with its
 *          fakes and hands them back on the result, unclaimed input members reach the context, `path` and `search`
 *          shape the request, and a loader's throw rejects.
 * Boundary: test only; the session and tenancy switcher are local fakes; clears the parts after each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decisions 3 and 6).
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { Layout } from "#core/bases/layout.base";
import { Route } from "#core/bases/route.base";
import { routeRef } from "#core/functions/route-ref.function";
import type { LayoutContext } from "#core/types/layout-context.type";
import type { RouteContext } from "#core/types/route-context.type";
import { ROUTE_TESTING_PARTS } from "#testing/constants/route-testing-parts.constant";
import { registerRouteTestingPart } from "#testing/functions/register-route-testing-part.function";
import { runRouteLoader } from "#testing/functions/run-route-loader.function";

const Routes = { sign_in: routeRef("sign_in") };

/** A stand-in for the tenancy switcher. */
class ScopeSwitcherFake {
  switchTo = vi.fn(async (_scopeId: string) => undefined);
}

class TabsLayout extends Layout {
  private readonly scopes: ScopeSwitcherFake;

  constructor(scopes: ScopeSwitcherFake) {
    super();
    this.scopes = scopes;
  }

  override async loader(ctx: LayoutContext<this>) {
    const { session } = ctx as unknown as { session: { memberships: string[] } | null };
    if (!session) return ctx.redirect(Routes.sign_in, { resume: true });
    const [first] = session.memberships;
    if (first) await this.scopes.switchTo(first);
    return null;
  }
}

class BrokenLayout extends Layout {
  override loader(): never {
    throw new Error("storage locked");
  }
}

class EchoRoute extends Route({ path: "/echo" }) {
  override loader(ctx: RouteContext<this>) {
    return {
      path: ctx.path,
      search: ctx.search,
      clients: (ctx as unknown as { clients: unknown }).clients,
    };
  }
}

/** The tenancy part: builds the layout with a fresh switcher and hands the switcher back. */
const tenancyPart = () => {
  const tenancy = new ScopeSwitcherFake();
  return { instance: new TabsLayout(tenancy), context: { tenancy } };
};

afterEach(() => {
  ROUTE_TESTING_PARTS.clear();
});

describe("runRouteLoader", () => {
  it("returns a redirect as { redirect, params }", async () => {
    const { result } = await runRouteLoader(TabsLayout, { session: null });
    expect(result).toEqual({ redirect: Routes.sign_in, params: { resume: true } });
  });

  it("runs the instance a registered part builds and returns its fakes", async () => {
    registerRouteTestingPart("@stackra/tenancy", tenancyPart);
    const run = (await runRouteLoader(TabsLayout, {
      session: { memberships: ["tnt_1", "tnt_2"] },
    })) as { result: unknown; tenancy: ScopeSwitcherFake };
    expect(run.result).toBeNull();
    expect(run.tenancy.switchTo).toHaveBeenCalledWith("tnt_1");
  });

  it("runs a part passed in services for this call only", async () => {
    const run = (await runRouteLoader(TabsLayout, {
      session: { memberships: ["tnt_9"] },
      services: [tenancyPart],
    })) as { result: unknown; tenancy: ScopeSwitcherFake };
    expect(run.tenancy.switchTo).toHaveBeenCalledWith("tnt_9");
    expect(ROUTE_TESTING_PARTS.size).toBe(0);
  });

  it("builds the request from path and search and passes unclaimed members to the context", async () => {
    const clients = [{ name: "commerce" }];
    const { result } = await runRouteLoader(EchoRoute, {
      path: "/echo?status=paid",
      search: { returnTo: "/settings" },
      clients,
    });
    expect(result).toEqual({
      path: "/echo?status=paid&returnTo=%2Fsettings",
      search: { status: "paid", returnTo: "/settings" },
      clients,
    });
  });

  it("rejects with the loader's error", async () => {
    await expect(runRouteLoader(BrokenLayout)).rejects.toThrow("storage locked");
  });
});

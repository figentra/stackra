/**
 * Stackra file contract:
 * Purpose: unit tests of `runLoader` over the template's layout test: a redirect comes back as `{ redirect, params }`,
 *          a testing part builds the instance with its fakes and hands them back on the result, unclaimed input
 *          members reach the context, and a loader's throw rejects.
 * Boundary: test only; the session, storage and tenancy switcher are local fakes; clears the parts after each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decisions 3 and 6).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { Layout } from "#core/bases/layout.base";
import { routeRef } from "#core/functions/route-ref.function";
import type { LayoutContext } from "#core/types/layout-context.type";
import { ROUTE_TESTING_PARTS } from "#testing/constants/route-testing-parts.constant";
import { registerRouteTestingPart } from "#testing/functions/register-route-testing-part.function";
import { runLoader } from "#testing/functions/run-loader.function";

const Routes = { sign_in: routeRef("sign_in") };

/** A stand-in for the tenancy switcher. */
class TenantSwitcher {
  switchTo = vi.fn(async (_tenantId: string) => undefined);
}

class TabsLayout extends Layout {
  private readonly tenants: TenantSwitcher;

  constructor(tenants: TenantSwitcher) {
    super();
    this.tenants = tenants;
  }

  override async loader(ctx: LayoutContext<this>) {
    const { session } = ctx as unknown as { session: { tenants: string[] } | null };
    if (!session) return ctx.redirect(Routes.sign_in, { resume: true });
    const [first] = session.tenants;
    if (first) await this.tenants.switchTo(first);
    return null;
  }
}

class BrokenLayout extends Layout {
  override loader(): never {
    throw new Error("storage locked");
  }
}

afterEach(() => {
  ROUTE_TESTING_PARTS.clear();
});

describe("runLoader", () => {
  it("returns a redirect as { redirect, params }", async () => {
    const { result } = await runLoader(TabsLayout, { session: null });
    expect(result).toEqual({ redirect: Routes.sign_in, params: { resume: true } });
  });

  it("runs the instance a part builds and returns its fakes", async () => {
    registerRouteTestingPart("@stackra/tenancy", () => {
      const tenancy = new TenantSwitcher();
      return { instance: new TabsLayout(tenancy), context: { tenancy } };
    });
    const run = (await runLoader(TabsLayout, { session: { tenants: ["tnt_1", "tnt_2"] } })) as {
      result: unknown;
      tenancy: TenantSwitcher;
    };
    expect(run.result).toBeNull();
    expect(run.tenancy.switchTo).toHaveBeenCalledWith("tnt_1");
  });

  it("rejects with the loader's error", async () => {
    await expect(runLoader(BrokenLayout)).rejects.toThrow("storage locked");
  });
});

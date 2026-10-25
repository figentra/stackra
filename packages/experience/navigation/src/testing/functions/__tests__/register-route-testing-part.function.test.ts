/**
 * Stackra file contract:
 * Purpose: unit tests of `registerRouteTestingPart`: a part fakes members for every run, the same name replaces and
 *          moves last, a later part wins a shared member, and the disposer removes only its own registration.
 * Boundary: test only; clears the parts after each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3).
 */
import { afterEach, describe, expect, it } from "vitest";

import { Layout } from "#core/bases/layout.base";
import type { LayoutContext } from "#core/types/layout-context.type";
import { ROUTE_TESTING_PARTS } from "#testing/constants/route-testing-parts.constant";
import { registerRouteTestingPart } from "#testing/functions/register-route-testing-part.function";
import { runRouteLoader } from "#testing/functions/run-route-loader.function";

class EchoLayout extends Layout {
  override loader(ctx: LayoutContext<this>) {
    return (ctx as unknown as { session: unknown }).session;
  }
}

afterEach(() => {
  ROUTE_TESTING_PARTS.clear();
});

describe("registerRouteTestingPart", () => {
  it("fakes members for every run, a later part winning", async () => {
    registerRouteTestingPart("@stackra/identity", ({ input }) => ({
      context: { session: input["session"] ?? "anonymous" },
    }));
    expect((await runRouteLoader(EchoLayout)).result).toBe("anonymous");
    registerRouteTestingPart("@acme/override", () => ({ context: { session: "override" } }));
    expect((await runRouteLoader(EchoLayout)).result).toBe("override");
  });

  it("replaces a name, moving it last, and disposes only its own part", async () => {
    const first = registerRouteTestingPart("a", () => ({ context: { session: "a1" } }));
    registerRouteTestingPart("b", () => ({ context: { session: "b" } }));
    const again = registerRouteTestingPart("a", () => ({ context: { session: "a2" } }));
    expect([...ROUTE_TESTING_PARTS.keys()]).toEqual(["b", "a"]);
    expect((await runRouteLoader(EchoLayout)).result).toBe("a2");
    first();
    expect(ROUTE_TESTING_PARTS.has("a")).toBe(true);
    again();
    expect((await runRouteLoader(EchoLayout)).result).toBe("b");
  });
});

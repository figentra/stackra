/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Explorer`: a bare kind base registered as `explorer`, whose subclass must
 *          implement `onApplicationBootstrap()`, a hook the container may await.
 * Boundary: test only; the once-after-boot guarantee is proven in the container's tests.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0144 as amended by
 *                     0263 (Explorers).
 */
import { describe, expect, it } from "@stackra/testing";

import { Explorer } from "#core/bases/explorer.base";
import { kindOf } from "#core/functions/kind-of.function";

class AsyncExplorer extends Explorer {
  ran = false;

  onApplicationBootstrap(): Promise<void> {
    this.ran = true;
    return Promise.resolve();
  }
}

describe("Explorer", () => {
  it("is the registered bare base of an explorer", () => {
    expect(kindOf(Explorer)).toEqual({ kind: "explorer", options: {} });
    expect(kindOf(AsyncExplorer)?.kind).toBe("explorer");
  });

  it("lets the bootstrap hook return a promise", async () => {
    const explorer = new AsyncExplorer();
    await explorer.onApplicationBootstrap();
    expect(explorer.ran).toBe(true);
  });

  it("makes a subclass implement the bootstrap hook", () => {
    // @ts-expect-error -- onApplicationBootstrap is abstract
    class SilentExplorer extends Explorer {}
    expect(SilentExplorer).toBeTypeOf("function");
  });
});

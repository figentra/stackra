/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: the template imports `FlagProvider` from it (its configs
 *          type `DriverName<FlagProvider>`, its generated wiring names the port), nothing else is a value, and the
 *          public type resolves.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type { FlagContext } from "#contracts/index";

describe("@stackra/feature-flags/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual(["FlagProvider"]);
  });

  it("resolves its public type", () => {
    expectTypeOf<FlagContext>().toEqualTypeOf<{
      readonly subject: string | null;
      readonly scope: string | null;
    }>();
  });
});

/**
 * Stackra file contract:
 * Purpose: unit and type tests of `StoreEnvironment`: an `Enum.of` enum with the five deploy environment codes, with a
 *          same-named type, and `MEMORY_STORE_ENVIRONMENTS` naming only `dev` and `test`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 16: Enum); ADR 0266 (decision 2); STA-2798.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { MEMORY_STORE_ENVIRONMENTS } from "#core/constants/memory-store-environments.constant";
import { StoreEnvironment } from "#core/enums/store-environment.enum";

describe("StoreEnvironment", () => {
  it("holds its codes in order", () => {
    expect(Enum.values(StoreEnvironment)).toEqual([
      "dev",
      "preview",
      "test",
      "staging",
      "production",
    ]);
  });

  it("types its values", () => {
    expectTypeOf<StoreEnvironment>().toEqualTypeOf<
      "dev" | "preview" | "test" | "staging" | "production"
    >();
  });

  it("allows the memory stores in dev and test only", () => {
    expect(MEMORY_STORE_ENVIRONMENTS).toEqual(["dev", "test"]);
    expect(Object.isFrozen(MEMORY_STORE_ENVIRONMENTS)).toBe(true);
  });
});

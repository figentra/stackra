/**
 * Stackra file contract:
 * Purpose: unit and type tests of `ImportMode`: an `Enum.of` enum whose codes are in source order, with a same-named
 *          type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ImportMode } from "#core/enums/import-mode.enum";

describe("ImportMode", () => {
  it("holds its codes in order", () => {
    expect(Enum.values(ImportMode)).toEqual(["create", "update", "upsert"]);
    expect(ImportMode.Create).toBe("create");
  });

  it("types its values", () => {
    expectTypeOf<ImportMode>().toEqualTypeOf<"create" | "update" | "upsert">();
  });
});

/**
 * Stackra file contract:
 * Purpose: unit and type tests of `IdMinting`: an `Enum.of` enum holding who mints a queued call's new id, codes in source order, with a
 *          same-named type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { IdMinting } from "#core/enums/id-minting.enum";

describe("IdMinting", () => {
  it("holds its snake_case codes in order", () => {
    expect(Enum.values(IdMinting)).toEqual(["client", "server"]);
    expect(IdMinting.Client).toBe("client");
    expect(IdMinting.Server).toBe("server");
  });

  it("types its values", () => {
    expectTypeOf<IdMinting>().toEqualTypeOf<"client" | "server">();
  });
});

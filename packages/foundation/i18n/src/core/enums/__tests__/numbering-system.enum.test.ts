/**
 * Stackra file contract:
 * Purpose: unit tests of `NumberingSystem`: the Intl `nu` codes `latn` and `arab`, and `user`, which Intl accepts as
 *          no extension at all.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0192 (decision 2).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { NumberingSystem } from "#core/enums/numbering-system.enum";

describe("NumberingSystem", () => {
  it("holds Latin, Arabic-Indic and the user's own digits", () => {
    expect(Enum.values(NumberingSystem)).toEqual(["latn", "arab", "user"]);
  });

  it("uses the codes Intl reads as the nu extension", () => {
    expect(new Intl.NumberFormat(`ar-u-nu-${NumberingSystem.Latn}`).format(12)).toBe("12");
    expect(new Intl.NumberFormat(`en-u-nu-${NumberingSystem.Arab}`).format(12)).toBe("١٢");
  });
});

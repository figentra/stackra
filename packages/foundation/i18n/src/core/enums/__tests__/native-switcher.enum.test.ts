/**
 * Stackra file contract:
 * Purpose: unit tests of `NativeSwitcher`: exactly the `system` and `in_app` owners, `system` first as the default.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0080 (2026-10-29 note).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { NativeSwitcher } from "#core/enums/native-switcher.enum";

describe("NativeSwitcher", () => {
  it("holds the phone and the app as owners of the language choice", () => {
    expect(Enum.values(NativeSwitcher)).toEqual(["system", "in_app"]);
    expectTypeOf<NativeSwitcher>().toEqualTypeOf<"system" | "in_app">();
  });
});

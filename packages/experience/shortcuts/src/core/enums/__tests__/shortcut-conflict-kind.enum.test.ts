/**
 * Stackra file contract:
 * Purpose: unit and type tests of `ShortcutConflictKind`: the two kinds with snake_case codes, typed as their union.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ShortcutConflictKind } from "#core/enums/shortcut-conflict-kind.enum";

describe("ShortcutConflictKind", () => {
  it("holds the two kinds", () => {
    expect(Enum.values(ShortcutConflictKind)).toEqual(["same", "prefix"]);
    expect(ShortcutConflictKind.Prefix).toBe("prefix");
    expectTypeOf<ShortcutConflictKind>().toEqualTypeOf<"same" | "prefix">();
  });
});

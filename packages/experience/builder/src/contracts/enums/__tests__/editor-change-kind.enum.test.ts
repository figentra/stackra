/**
 * Stackra file contract:
 * Purpose: unit and type tests of `EditorChangeKind`: the four snake_case change codes, in source order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0128 (`Enum.of`).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { EditorChangeKind } from "#contracts/enums/editor-change-kind.enum";

describe("EditorChangeKind", () => {
  it("lists the four changes", () => {
    expect(Enum.values(EditorChangeKind)).toEqual(["insert", "remove", "move", "set_prop"]);
    expect(EditorChangeKind.SetProp).toBe("set_prop");
  });

  it("types each case as its literal code", () => {
    expectTypeOf(EditorChangeKind.Move).toEqualTypeOf<"move">();
    expectTypeOf<EditorChangeKind>().toEqualTypeOf<"insert" | "remove" | "move" | "set_prop">();
  });
});

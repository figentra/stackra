/**
 * Stackra file contract:
 * Purpose: unit and type tests of `DocumentLayout`: an `Enum.of` enum whose codes are in source order, with a same-named
 *          type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { DocumentLayout } from "#core/enums/document-layout.enum";

describe("DocumentLayout", () => {
  it("holds its codes in order", () => {
    expect(Enum.values(DocumentLayout)).toEqual(["stack", "single_column"]);
    expect(DocumentLayout.Stack).toBe("stack");
  });

  it("types its values", () => {
    expectTypeOf<DocumentLayout>().toEqualTypeOf<"stack" | "single_column">();
  });
});

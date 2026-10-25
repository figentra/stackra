/**
 * Stackra file contract:
 * Purpose: unit and type tests of `DocumentKind`: an `Enum.of` enum whose codes are in source order, with a same-named
 *          type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { DocumentKind } from "#core/enums/document-kind.enum";

describe("DocumentKind", () => {
  it("holds its codes in order", () => {
    expect(Enum.values(DocumentKind)).toEqual(["page", "dashboard"]);
    expect(DocumentKind.Page).toBe("page");
  });

  it("types its values", () => {
    expectTypeOf<DocumentKind>().toEqualTypeOf<"page" | "dashboard">();
  });
});

/**
 * Stackra file contract:
 * Purpose: proves the CursorPagination contract matches the server's cursor pages: `hasMore` is the one required prop,
 *          the handlers take no argument and so no page number, the form is `pager` or `load-more`, and the count is a
 *          number the caller writes as a sentence.
 * Boundary: type assertions only; they are checked by the typechecker and the test passes at run time.
 * Runtime: node
 * Governing contract: ADR 0313 (decision 4); ADR 0022 (test placement).
 */
// @covers sta-350:FR-141
import type { Size } from "#contracts/enums/size.enum";
import type { CursorPaginationContractProps } from "#contracts/types/cursor-pagination-contract-props.type";

describe("CursorPaginationContractProps", () => {
  it("requires only hasMore", () => {
    expectTypeOf<{ hasMore: true }>().toExtend<CursorPaginationContractProps>();
    // @ts-expect-error -- a pager without `hasMore` cannot say whether a next page exists
    const empty: CursorPaginationContractProps = {};
    expect(empty).toEqual({});
  });

  it("moves by a handler with no argument, never by a page number", () => {
    expectTypeOf<CursorPaginationContractProps["onNext"]>().toEqualTypeOf<
      (() => void) | undefined
    >();
    expectTypeOf<CursorPaginationContractProps["onPrevious"]>().toEqualTypeOf<
      (() => void) | undefined
    >();
    expectTypeOf<CursorPaginationContractProps>().not.toHaveProperty("page");
    expectTypeOf<CursorPaginationContractProps>().not.toHaveProperty("total");
  });

  it("takes one of two forms, a size, and a count written by the caller", () => {
    expectTypeOf<CursorPaginationContractProps["mode"]>().toEqualTypeOf<
      "pager" | "load-more" | undefined
    >();
    expectTypeOf<CursorPaginationContractProps["size"]>().toEqualTypeOf<Size | undefined>();
    expectTypeOf<CursorPaginationContractProps["count"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<CursorPaginationContractProps["countLabel"]>().toEqualTypeOf<
      ((count: number) => string) | undefined
    >();
  });
});

/**
 * Stackra file contract:
 * Purpose: proves the FilterBar contract: it takes the `useCollection` engine whose search and filter it edits and the
 *          accessible name of its search box as required props, a hint for the box as an optional one, and nothing of
 *          the old resource query (`query`, `onQueryChange`, `filters`), the sort or the page.
 * Boundary: type assertions only; they are checked by the typechecker and the test passes at run time.
 * Runtime: node
 * Governing contract: ADR 0505 (one filter model); ADR 0022 (test placement).
 */
// @covers sta-350:FR-194
import type { CollectionController } from "#contracts/types/collection-controller.type";
import type { FilterBarContractProps } from "#contracts/types/filter-bar-contract-props.type";

describe("FilterBarContractProps", () => {
  it("takes the engine and the accessible name of the search box", () => {
    expectTypeOf<FilterBarContractProps["collection"]>().toEqualTypeOf<CollectionController>();
    expectTypeOf<FilterBarContractProps["searchLabel"]>().toEqualTypeOf<string>();
  });

  it("offers a hint for the search box and nothing of the resource query, the sort or the page", () => {
    expectTypeOf<FilterBarContractProps["searchPlaceholder"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<FilterBarContractProps>().not.toHaveProperty("query");
    expectTypeOf<FilterBarContractProps>().not.toHaveProperty("onQueryChange");
    expectTypeOf<FilterBarContractProps>().not.toHaveProperty("filters");
    expectTypeOf<FilterBarContractProps>().not.toHaveProperty("sort");
    expectTypeOf<FilterBarContractProps>().not.toHaveProperty("cursor");
  });
});

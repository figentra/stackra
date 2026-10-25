/**
 * Stackra file contract:
 * Purpose: proves the FilterBar contract: it takes the controlled resource query, the list of filter definitions and the
 *          accessible name of its search box as required props, a hint for the box as an optional one, and nothing for
 *          the sort or the page, which belong to the table and to the app.
 * Boundary: type assertions only; they are checked by the typechecker and the test passes at run time.
 * Runtime: node
 * Governing contract: ADR 0318 (decisions 1 to 3); ADR 0022 (test placement).
 */
// @covers sta-350:FR-194
import type { FilterBarContractProps } from "#contracts/types/filter-bar-contract-props.type";
import type { FilterDefinition } from "#contracts/types/filter-definition.type";
import type { ResourceQueryContractProps } from "#contracts/types/resource-query-contract-props.type";

describe("FilterBarContractProps", () => {
  it("takes the controlled query, as every resource index piece does", () => {
    expectTypeOf<FilterBarContractProps>().toExtend<ResourceQueryContractProps>();
    expectTypeOf<FilterBarContractProps["query"]>().not.toBeUndefined();
    expectTypeOf<FilterBarContractProps["onQueryChange"]>().toBeFunction();
  });

  it("requires the filters and the accessible name of the search box", () => {
    expectTypeOf<FilterBarContractProps["filters"]>().toEqualTypeOf<readonly FilterDefinition[]>();
    expectTypeOf<FilterBarContractProps["searchLabel"]>().toEqualTypeOf<string>();
  });

  it("offers a hint for the search box and nothing for the sort or the page", () => {
    expectTypeOf<FilterBarContractProps["searchPlaceholder"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<FilterBarContractProps>().not.toHaveProperty("sort");
    expectTypeOf<FilterBarContractProps>().not.toHaveProperty("cursor");
    expectTypeOf<FilterBarContractProps>().not.toHaveProperty("searchParams");
  });
});

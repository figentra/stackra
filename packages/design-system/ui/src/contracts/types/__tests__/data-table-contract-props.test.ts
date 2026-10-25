/**
 * Stackra file contract:
 * Purpose: proves the DataTable and BulkActionBar contracts: the table takes the Table's props without its own sort and
 *          end-of-list paging (the query and the pager replace them), requires the controlled query, takes a row's
 *          actions as a function of the row and a selection's as a list, reuses "select all N across pages" and the
 *          cursor paging handlers by name, and offers the `filterBar` slot as any node; the bar requires the count, the
 *          actions and the clear handler, and shares "select all N" with the table.
 * Boundary: type assertions only; they are checked by the typechecker and the test passes at run time.
 * Runtime: node
 * Governing contract: ADR 0318 (decisions 2 and 4 to 6); ADR 0022 (test placement).
 */
// @covers sta-350:FR-188
import type { ReactNode } from "react";

import type { AllMatchingSelectionContractProps } from "#contracts/types/all-matching-selection-contract-props.type";
import type { BulkActionBarContractProps } from "#contracts/types/bulk-action-bar-contract-props.type";
import type { CursorPaginationContractProps } from "#contracts/types/cursor-pagination-contract-props.type";
import type { DataTableContractProps } from "#contracts/types/data-table-contract-props.type";
import type { ResourceAction } from "#contracts/types/resource-action.type";
import type { ResourceQueryContractProps } from "#contracts/types/resource-query-contract-props.type";
import type { TableContractProps } from "#contracts/types/table-contract-props.type";

interface Order {
  readonly id: string;
  readonly number: string;
}

describe("DataTableContractProps", () => {
  it("takes the Table's props, the controlled query and select all N", () => {
    expectTypeOf<DataTableContractProps<Order>>().toExtend<ResourceQueryContractProps>();
    expectTypeOf<DataTableContractProps<Order>>().toExtend<AllMatchingSelectionContractProps>();
    expectTypeOf<DataTableContractProps<Order>["columns"]>().toEqualTypeOf<
      TableContractProps<Order>["columns"]
    >();
    expectTypeOf<DataTableContractProps<Order>["items"]>().toEqualTypeOf<readonly Order[]>();
  });

  it("requires the query, because a resource index is server-driven and has no state of its own", () => {
    expectTypeOf<DataTableContractProps<Order>["query"]>().not.toBeUndefined();
    expectTypeOf<DataTableContractProps<Order>["onQueryChange"]>().toBeFunction();
  });

  it("leaves out the Table's own sort and end-of-list paging, which the query and the pager replace", () => {
    expectTypeOf<DataTableContractProps<Order>>().not.toHaveProperty("sortDescriptor");
    expectTypeOf<DataTableContractProps<Order>>().not.toHaveProperty("onSortChange");
    expectTypeOf<DataTableContractProps<Order>>().not.toHaveProperty("onLoadMore");
  });

  it("takes a row's actions as a function of the row and a selection's as a list", () => {
    expectTypeOf<DataTableContractProps<Order>["rowActions"]>().toEqualTypeOf<
      ((item: Order) => readonly ResourceAction[]) | undefined
    >();
    expectTypeOf<DataTableContractProps<Order>["bulkActions"]>().toEqualTypeOf<
      readonly ResourceAction[] | undefined
    >();
  });

  it("reuses the cursor paging handlers by name, and takes any node in the filterBar slot", () => {
    expectTypeOf<DataTableContractProps<Order>["onNext"]>().toEqualTypeOf<
      CursorPaginationContractProps["onNext"]
    >();
    expectTypeOf<DataTableContractProps<Order>["onPrevious"]>().toEqualTypeOf<
      CursorPaginationContractProps["onPrevious"]
    >();
    expectTypeOf<DataTableContractProps<Order>["filterBar"]>().toEqualTypeOf<ReactNode>();
  });

  it("types the error as whatever was thrown, with a retry that takes no argument", () => {
    expectTypeOf<DataTableContractProps<Order>["error"]>().toBeUnknown();
    expectTypeOf<DataTableContractProps<Order>["onRetry"]>().toEqualTypeOf<
      (() => void) | undefined
    >();
  });
});

describe("BulkActionBarContractProps", () => {
  it("requires the count, the actions and the clear handler", () => {
    expectTypeOf<{
      selectedCount: number;
      actions: readonly ResourceAction[];
      onClearSelection: () => void;
    }>().toExtend<BulkActionBarContractProps>();
    // @ts-expect-error -- a bar without a clear handler would leave the selection with no way out
    const incomplete: BulkActionBarContractProps = { selectedCount: 1, actions: [] };
    expect(incomplete.selectedCount).toBe(1);
  });

  it("shares select all N across pages with the table, and asks whether the page is fully selected", () => {
    expectTypeOf<BulkActionBarContractProps>().toExtend<AllMatchingSelectionContractProps>();
    expectTypeOf<BulkActionBarContractProps["isPageSelected"]>().toEqualTypeOf<
      boolean | undefined
    >();
  });

  it("lets the caller write its sentences as functions of the count", () => {
    expectTypeOf<BulkActionBarContractProps["countLabel"]>().toEqualTypeOf<
      ((count: number) => string) | undefined
    >();
    expectTypeOf<BulkActionBarContractProps["selectAllLabel"]>().toEqualTypeOf<
      ((totalCount: number) => string) | undefined
    >();
  });
});

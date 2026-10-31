/**
 * Stackra file contract:
 * Purpose: proves the DataTable and BulkActionBar contracts: the table takes a `useCollection` engine or the shorthand
 *          items and columns, holds none of the engine's state (no resource query, sort, selection or pager handlers),
 *          takes a row's actions as a function of the row and a selection's as a list, and offers the `filterBar` slot
 *          as any node; the bar requires the count, the actions and the clear handler, and shares "select all N".
 * Boundary: type assertions only; they are checked by the typechecker and the test passes at run time.
 * Runtime: node
 * Governing contract: ADR 0505 (one data family); ADR 0022 (test placement).
 */
// @covers sta-350:FR-188
import type { ReactNode } from "react";

import type { AllMatchingSelectionContractProps } from "#contracts/types/all-matching-selection-contract-props.type";
import type { BulkActionBarContractProps } from "#contracts/types/bulk-action-bar-contract-props.type";
import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { CollectionController } from "#contracts/types/collection-controller.type";
import type { DataTableContractProps } from "#contracts/types/data-table-contract-props.type";
import type { ResourceAction } from "#contracts/types/resource-action.type";

interface Order {
  readonly id: string;
  readonly number: string;
}

describe("DataTableContractProps", () => {
  it("takes an engine, or the shorthand items and columns of one it runs itself", () => {
    expectTypeOf<DataTableContractProps<Order>["collection"]>().toEqualTypeOf<
      CollectionController<Order> | undefined
    >();
    expectTypeOf<DataTableContractProps<Order>["items"]>().toEqualTypeOf<
      readonly Order[] | undefined
    >();
    expectTypeOf<DataTableContractProps<Order>["columns"]>().toEqualTypeOf<
      readonly CollectionColumn[] | undefined
    >();
  });

  it("leaves out the resource query and every state the engine holds", () => {
    expectTypeOf<DataTableContractProps<Order>>().not.toHaveProperty("query");
    expectTypeOf<DataTableContractProps<Order>>().not.toHaveProperty("onQueryChange");
    expectTypeOf<DataTableContractProps<Order>>().not.toHaveProperty("hiddenColumns");
    expectTypeOf<DataTableContractProps<Order>>().not.toHaveProperty("selectedKeys");
    expectTypeOf<DataTableContractProps<Order>>().not.toHaveProperty("onNext");
    expectTypeOf<DataTableContractProps<Order>>().not.toHaveProperty("sort");
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

  it("takes any node in the filterBar slot", () => {
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

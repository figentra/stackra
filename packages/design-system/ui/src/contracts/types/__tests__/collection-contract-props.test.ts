/**
 * Stackra file contract:
 * Purpose: proves the shared collection contracts compose: a collection is items plus an empty state and a loading
 *          flag, a selection is a mode plus keys as lists of strings, a sort is a column and one of two directions,
 *          and every prop but `items` is optional so Table, List and Tabs add only what they need.
 * Boundary: type assertions only; they are checked by the typechecker and the test passes at run time.
 * Runtime: node
 * Governing contract: ADR 0313; ADR 0022 (test placement).
 */
// @covers sta-350:FR-121
import type { ReactNode } from "react";

import type { AriaSortDirection } from "#contracts/enums/aria-sort-direction.enum";
import type { CollectionContractProps } from "#contracts/types/collection-contract-props.type";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { SelectionContractProps } from "#contracts/types/selection-contract-props.type";
import type { SortDescriptor } from "#contracts/types/sort-descriptor.type";

interface OrderRow extends CollectionItem {
  readonly total: number;
}

describe("collection contracts", () => {
  it("takes the items of any type that has an id", () => {
    expectTypeOf<CollectionContractProps<OrderRow>["items"]>().toEqualTypeOf<readonly OrderRow[]>();
    expectTypeOf<CollectionContractProps["items"]>().toEqualTypeOf<readonly CollectionItem[]>();
  });

  it("types the empty state as a node and the loading flag as a boolean", () => {
    expectTypeOf<CollectionContractProps["emptyState"]>().toEqualTypeOf<ReactNode>();
    expectTypeOf<CollectionContractProps["isLoading"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<CollectionContractProps["loadingLabel"]>().toEqualTypeOf<string | undefined>();
  });

  it("reports the selection as lists of ids, never as a Set", () => {
    expectTypeOf<SelectionContractProps["selectedKeys"]>().toEqualTypeOf<
      readonly string[] | undefined
    >();
    expectTypeOf<SelectionContractProps["onSelectionChange"]>().toEqualTypeOf<
      ((keys: readonly string[]) => void) | undefined
    >();
    expectTypeOf<SelectionContractProps["selectionMode"]>().toEqualTypeOf<
      "none" | "single" | "multiple" | undefined
    >();
  });

  it("lets Tabs leave the selection mode out", () => {
    expectTypeOf<Omit<SelectionContractProps, "selectionMode">>().not.toHaveProperty(
      "selectionMode",
    );
  });

  it("sorts one column in one of two directions", () => {
    expectTypeOf<SortDescriptor["column"]>().toEqualTypeOf<string>();
    expectTypeOf<SortDescriptor["direction"]>().toEqualTypeOf<AriaSortDirection>();
    expectTypeOf<AriaSortDirection>().toEqualTypeOf<"ascending" | "descending">();
  });

  it("makes every selection prop optional", () => {
    expectTypeOf<Record<never, never>>().toExtend<SelectionContractProps>();
    expectTypeOf<{
      readonly items: readonly CollectionItem[];
    }>().toExtend<CollectionContractProps>();
  });
});

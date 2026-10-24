/**
 * Stackra file contract:
 * Purpose: proves the List contract is the collection and selection vocabulary over rows with an `id`, that a row needs
 *          only an `id` and a title, that a list needs only its items and its accessible name, that the row's icon slot is
 *          an `IconSlot`, and that the list's paging and press handlers take no arguments.
 * Boundary: type assertions only; they are checked by the typechecker and the test passes at run time.
 * Runtime: node
 * Governing contract: ADR 0313 (decisions 1, 2, 4 and 5); ADR 0022 (test placement).
 */
// @covers sta-350:FR-126 sta-350:P-064
import type { CollectionContractProps } from "#contracts/types/collection-contract-props.type";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { IconSlot } from "#contracts/types/icon-slot.type";
import type { ListContractProps } from "#contracts/types/list-contract-props.type";
import type {
  ListItemContractProps,
  ListItemData,
} from "#contracts/types/list-item-contract-props.type";
import type { SelectionContractProps } from "#contracts/types/selection-contract-props.type";

describe("ListContractProps", () => {
  it("is the collection and the selection contract over rows", () => {
    expectTypeOf<ListContractProps>().toExtend<CollectionContractProps<ListItemData>>();
    expectTypeOf<ListContractProps>().toExtend<SelectionContractProps>();
    expectTypeOf<ListContractProps["items"]>().toEqualTypeOf<readonly ListItemData[]>();
  });

  it("needs the items and the accessible name, and nothing else", () => {
    expectTypeOf<{ items: readonly ListItemData[]; label: string }>().toExtend<ListContractProps>();
    expectTypeOf<{ items: readonly ListItemData[] }>().not.toExtend<ListContractProps>();
    expectTypeOf<{ label: string }>().not.toExtend<ListContractProps>();
  });

  it("takes the end reached and the next page as handlers with no arguments", () => {
    expectTypeOf<ListContractProps["onLoadMore"]>().toEqualTypeOf<(() => void) | undefined>();
    expectTypeOf<ListContractProps["hasMore"]>().toEqualTypeOf<boolean | undefined>();
  });

  it("keeps an app's own row type, so long as it has the row's props and an id", () => {
    interface OrderRow extends ListItemData {
      readonly total: number;
    }
    expectTypeOf<ListContractProps<OrderRow>["items"]>().toEqualTypeOf<readonly OrderRow[]>();
  });
});

describe("ListItemContractProps", () => {
  it("needs only a title", () => {
    expectTypeOf<{ title: string }>().toExtend<ListItemContractProps>();
    expectTypeOf<Record<never, never>>().not.toExtend<ListItemContractProps>();
  });

  it("draws the start as an icon slot and presses with no argument", () => {
    expectTypeOf<ListItemContractProps["startIcon"]>().toEqualTypeOf<IconSlot | undefined>();
    expectTypeOf<ListItemContractProps["onPress"]>().toEqualTypeOf<(() => void) | undefined>();
  });

  it("is a row of a list once it has an id", () => {
    expectTypeOf<ListItemData>().toExtend<ListItemContractProps>();
    expectTypeOf<ListItemData>().toExtend<CollectionItem>();
    expectTypeOf<ListItemContractProps>().not.toHaveProperty("id");
  });
});

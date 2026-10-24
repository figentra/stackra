/**
 * Stackra file contract:
 * Purpose: the props every runtime's `List` takes: the collection and selection vocabulary of wave 5 over rows of
 *          `ListItemData`, plus the list's accessible name, the surface it sits on, and the forward paging of a
 *          cursor page. Each runtime's `ListProps` is this plus its own root's props, which pass through unchanged.
 * Boundary: types only. The list never sorts, filters or fetches: it draws `items` and reports the end reached.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0313 (decisions 1, 2, 4 and 5).
 */
import type { SurfaceVariant } from "#contracts/enums/surface-variant.enum";
import type { CollectionContractProps } from "#contracts/types/collection-contract-props.type";
import type { ListItemData } from "#contracts/types/list-item-contract-props.type";
import type { SelectionContractProps } from "#contracts/types/selection-contract-props.type";

/** Props shared by the web and native `List`. */
export interface ListContractProps<TItem extends ListItemData = ListItemData>
  extends CollectionContractProps<TItem>, SelectionContractProps {
  /** The spoken name of the list, for example "Recent orders". */
  readonly label: string;
  /** The surface level the rows sit on. Defaults to `default`. */
  readonly variant?: SurfaceVariant | undefined;
  /** True while a cursor page has a next one; `onLoadMore` is called only then. */
  readonly hasMore?: boolean | undefined;
  /** Called when the end of the list is reached and `hasMore` is true, never while `isLoading`. */
  readonly onLoadMore?: (() => void) | undefined;
}

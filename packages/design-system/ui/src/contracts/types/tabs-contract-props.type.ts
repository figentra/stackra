/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Tabs` takes: the collection contract over `TabItem`s (items, empty state,
 *          loading), the selection contract without its mode (a tab list always holds exactly one tab), the spoken name
 *          of the tab list, the axis, the variant and a switch for the whole list. Each runtime's `TabsProps` is this plus
 *          its HeroUI tabs' own props, which pass through unchanged.
 * Boundary: types only. The selection is a list of one id, as in every wave 5 collection; with none given, the first
 *           tab that is not disabled is selected.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); ADR 0313 (decisions 1,
 *          2, 5 and 7); WAI-ARIA 1.2 tabs pattern.
 */
import type { Orientation } from "#contracts/enums/orientation.enum";
import type { Variant } from "#contracts/enums/variant.enum";
import type { CollectionContractProps } from "#contracts/types/collection-contract-props.type";
import type { SelectionContractProps } from "#contracts/types/selection-contract-props.type";
import type { TabItem } from "#contracts/types/tab-item.type";

/** Props shared by the web and native `Tabs`. */
export interface TabsContractProps
  extends CollectionContractProps<TabItem>, Omit<SelectionContractProps, "selectionMode"> {
  /** The spoken name of the tab list, for example "Order sections"; name it when a page holds more than one. */
  readonly label?: string | undefined;
  /** The axis the tabs run along. Defaults to `horizontal`; native has no vertical tabs and reads it as horizontal. */
  readonly orientation?: Orientation | undefined;
  /** The emphasis of the selected tab: `primary` is a raised pill, `secondary` a flat one. Defaults to `primary`. */
  readonly variant?: Exclude<Variant, "tertiary"> | undefined;
  /** True to show every tab but refuse selecting any of them. */
  readonly isDisabled?: boolean | undefined;
  /**
   * What happens to tabs that do not fit the row: `scroll` (the default) scrolls the row; `menu` keeps the tabs that
   * fit and lists the rest in a "More" menu at the end (the selected tab always stays in the row). Native always scrolls.
   */
  readonly overflow?: "scroll" | "menu" | undefined;
  /** Called with a closable tab's id when its close mark is pressed, or Delete is pressed on it on web. */
  readonly onClose?: ((id: string) => void) | undefined;
}

/**
 * Stackra file contract:
 * Purpose: the web `ListView` compound on HeroUI Pro's ListView: the selectable list root, which maps the contract's
 *          `label` to `aria-label` and `isVirtualized` to `virtualized`, and the parts Item, ItemContent, Title,
 *          Description and ItemAction.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. Selection, `onAction` and
 *          the item's `onPress` and `isDisabled` are React Aria's, passed through. The compound exposes the
 *          documented parts: HeroUI Pro's `ListView.Root` is left out.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import { ListView as HeroListView } from "@heroui-pro/react/list-view";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { ListViewProps } from "#react/list-view/list-view.props";

/** The list root: HeroUI Pro's, named by `label`. */
function ListViewRoot<T extends object>({ label, isVirtualized, ...rest }: ListViewProps<T>) {
  return (
    <HeroListView.Root<T>
      {...rest}
      {...omitUndefined({ virtualized: isVirtualized })}
      aria-label={label}
    />
  );
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface ListViewParts {
  /** One row; its `id` is the selection key. */
  readonly Item: typeof HeroListView.Item;
  /** The text column of a row. */
  readonly ItemContent: typeof HeroListView.ItemContent;
  /** The row's name. */
  readonly Title: typeof HeroListView.Title;
  /** A line of supporting text under the title. */
  readonly Description: typeof HeroListView.Description;
  /** The trailing control of a row. */
  readonly ItemAction: typeof HeroListView.ItemAction;
}

/** A selectable list of rows: `ListView.Item` with `ItemContent`, `Title`, `Description` and `ItemAction`. */
export const ListView: typeof ListViewRoot & ListViewParts = Object.assign(ListViewRoot, {
  Item: HeroListView.Item,
  ItemContent: HeroListView.ItemContent,
  Title: HeroListView.Title,
  Description: HeroListView.Description,
  ItemAction: HeroListView.ItemAction,
});

/**
 * Stackra file contract:
 * Purpose: the web `ContextMenu` compound on HeroUI Pro's ContextMenu: the root maps `isOpen` to HeroUI Pro's `open`,
 *          `ContextMenu.Menu` names its menu from `label`, and every other part (Trigger, Popover, Item,
 *          ItemIndicator, Section, Separator, SubmenuTrigger, SubmenuIndicator) is HeroUI Pro's own.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. The compound exposes the
 *          documented parts: HeroUI Pro's `ContextMenu.Root` is left out. Imports the `context-menu` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */
import { ContextMenu as HeroContextMenu } from "@heroui-pro/react/context-menu";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { ContextMenuProps } from "#react/context-menu/context-menu.props";
import type { ContextMenuMenuProps } from "#react/context-menu/context-menu-menu.props";

/** The root: HeroUI Pro's, which holds the open state shared by the trigger and the popover. */
function ContextMenuRoot({ isOpen, ...rest }: ContextMenuProps) {
  return <HeroContextMenu.Root {...rest} {...omitUndefined({ open: isOpen })} />;
}

/** The menu: HeroUI Pro's, named by `label`. */
function ContextMenuMenu<T extends object>({ label, ...rest }: ContextMenuMenuProps<T>) {
  return <HeroContextMenu.Menu<T> {...rest} aria-label={label} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface ContextMenuParts {
  /** The area that opens the menu on a secondary press. */
  readonly Trigger: typeof HeroContextMenu.Trigger;
  /** The popover that holds the menu. */
  readonly Popover: typeof HeroContextMenu.Popover;
  /** The list of items, named by `label`. */
  readonly Menu: typeof ContextMenuMenu;
  /** One menu entry. */
  readonly Item: typeof HeroContextMenu.Item;
  /** The check or mark that shows an item's selection. */
  readonly ItemIndicator: typeof HeroContextMenu.ItemIndicator;
  /** A headed group of items. */
  readonly Section: typeof HeroContextMenu.Section;
  /** A divider between items. */
  readonly Separator: typeof HeroContextMenu.Separator;
  /** An item that opens a submenu. */
  readonly SubmenuTrigger: typeof HeroContextMenu.SubmenuTrigger;
  /** The chevron that shows a submenu. */
  readonly SubmenuIndicator: typeof HeroContextMenu.SubmenuIndicator;
}

/**
 * A menu that opens on a secondary press: `ContextMenu.Trigger` is the area, `ContextMenu.Popover` holds
 * `ContextMenu.Menu` of `ContextMenu.Item`. Name the menu for screen readers with `label`.
 */
export const ContextMenu: typeof ContextMenuRoot & ContextMenuParts = Object.assign(
  ContextMenuRoot,
  {
    Trigger: HeroContextMenu.Trigger,
    Popover: HeroContextMenu.Popover,
    Menu: ContextMenuMenu,
    Item: HeroContextMenu.Item,
    ItemIndicator: HeroContextMenu.ItemIndicator,
    Section: HeroContextMenu.Section,
    Separator: HeroContextMenu.Separator,
    SubmenuTrigger: HeroContextMenu.SubmenuTrigger,
    SubmenuIndicator: HeroContextMenu.SubmenuIndicator,
  },
);

/**
 * Stackra file contract:
 * Purpose: the web `ActionMenu`: the "more actions" pattern, an `IconButton` that opens a `Menu` of grouped actions
 *          (icons, shortcut hints, danger tone, disabled items with their reason), as the contract's `label`, `icon`,
 *          `variant`, `size`, `isDisabled`, `sections`, `placement`, `align`, `onAction` and open state. Every other Menu
 *          prop passes through.
 * Boundary: builds on `#react/menu/menu` and `#react/icon-button/icon-button`; adds no behaviour of its own beyond
 *           keeping a choice inside the menu from reaching the row around the button (a click or Enter on an item would
 *           otherwise bubble up the React tree, through the portal, to the row's own handler). It opens at the button's
 *           reading end by default, because it sits at the end of a row. It has no selection.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0312; owner decision 6 of STA-350 (thin wrappers); WCAG 2.2 SC 2.1.1,
 *          4.1.2.
 */
import type { KeyboardEvent, MouseEvent, ReactElement } from "react";

import { IconButton } from "#react/icon-button/icon-button";
import { Menu } from "#react/menu/menu";
import type { ActionMenuProps } from "#react/action-menu/action-menu.props";

/** Stops a click that came from the button or the menu from reaching the row the button sits in. */
const stopClick = (event: MouseEvent<HTMLElement>) => event.stopPropagation();

/** Stops the keys that choose an action from reaching the row, which may open it on Enter or Space. */
const stopChoosingKey = (event: KeyboardEvent<HTMLElement>) => {
  if (event.key === "Enter" || event.key === " ") event.stopPropagation();
};

/**
 * A button that opens a menu of grouped actions, for the end of a row or the corner of a section. `label` names the
 * button; the menu is named by it.
 */
export function ActionMenu({
  label,
  icon = "ellipsis",
  variant = "ghost",
  size,
  isDisabled,
  placement = "bottom",
  align = "end",
  ...rest
}: ActionMenuProps): ReactElement {
  return (
    // `contents` keeps the wrapper out of layout; it only listens for events that bubble through the React tree.
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- reason: a layout-free wrapper that only stops events bubbling from the menu; it is not a control
    <span className="contents" onClick={stopClick} onKeyDown={stopChoosingKey}>
      <Menu {...rest} placement={placement} align={align}>
        <IconButton
          icon={icon}
          label={label}
          variant={variant}
          size={size}
          isDisabled={isDisabled}
        />
      </Menu>
    </span>
  );
}

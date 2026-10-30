/**
 * Stackra file contract:
 * Purpose: `MenuItemContent`, the content of one menu action: the selection mark, its icon, its label with a second
 *          line (or why it is disabled), and its shortcut hint. Shared by `Menu` and `Menubar`.
 * Boundary: content only; the item around it is HeroUI's Dropdown item.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); WCAG 2.2 SC 2.5.3.
 */
import { Dropdown, Kbd } from "@heroui/react";
import type { ReactElement } from "react";

import type { MenuLeafItem } from "#contracts/types/menu-leaf-item.type";
import { SlotIcon } from "#react/slot-icon/slot-icon";

/** The content of one action: its icon, its label with a second line, its shortcut hint and the selection mark. */
export function MenuItemContent({
  item,
  isSelectable,
}: {
  readonly item: MenuLeafItem;
  readonly isSelectable: boolean;
}): ReactElement {
  // A disabled action says why, in the place a description would go, because it cannot take focus to show a tooltip.
  const detail = item.isDisabled && item.disabledReason ? item.disabledReason : item.description;
  return (
    <>
      {isSelectable ? <Dropdown.ItemIndicator /> : null}
      <SlotIcon icon={item.icon} />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Plain spans, not React Aria's `label` and `description` slots: those name the item by its label alone
            and describe it by the rest, and the rest is visible text that a name must hold (WCAG 2.5.3). */}
        <span data-slot="label">{item.label}</span>
        {detail ? (
          <span data-slot="description" className="description">
            {detail}
          </span>
        ) : null}
      </div>
      {item.shortcut ? (
        <Kbd>
          <Kbd.Content>{item.shortcut}</Kbd.Content>
        </Kbd>
      ) : null}
    </>
  );
}

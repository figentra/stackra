/**
 * Stackra file contract:
 * Purpose: `MenuAction`, one menu action as HeroUI's Dropdown item: a link when it has an `href`, its handler as the
 *          item's own action, the danger tone and the disabled state. Shared by `Menu` and `Menubar`.
 * Boundary: one item; the menu around it is the caller's.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file).
 */
import { Dropdown } from "@heroui/react";
import type { ReactElement } from "react";

import type { MenuLeafItem } from "#contracts/types/menu-leaf-item.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { MenuItemContent } from "#react/menu/menu-item-content";

/** One action as a menu item: a link when it has an `href`, its handler as the item's own action. */
export function MenuAction({
  item,
  isSelectable,
}: {
  readonly item: MenuLeafItem;
  readonly isSelectable: boolean;
}): ReactElement {
  return (
    <Dropdown.Item
      id={item.id}
      textValue={item.label}
      variant={item.tone === "danger" ? "danger" : "default"}
      isDisabled={item.isDisabled ?? false}
      {...omitUndefined({ href: item.href, onAction: item.onPress })}
    >
      <MenuItemContent item={item} isSelectable={isSelectable} />
    </Dropdown.Item>
  );
}

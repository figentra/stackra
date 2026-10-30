/**
 * Stackra file contract:
 * Purpose: `SidebarItems`, how a Sidebar draws its `items` with its own parts: the top-level entries between groups
 *          form an unlabelled group, a top-level entry with `children` and no `href` or `onPress` is a labelled group
 *          of them, and any other entry with `children` is an entry with a sub-menu.
 * Boundary: internal to the Sidebar; the app composes the same parts itself when it needs more (actions, folding
 *           groups, its own rows).
 * Runtime: browser
 * Governing contract: ADR 0305; ADR 0317 (decisions 1 and 3); owner request 2026-10-29 (STA-1371).
 */
import type { ReactElement } from "react";

import type { NavigationItem } from "#contracts/types/navigation-item.type";
import { SidebarGroup } from "#react/sidebar/sidebar-group";
import type { SidebarItemsProps } from "#react/sidebar/sidebar-items-props.type";
import { SidebarMenu } from "#react/sidebar/sidebar-menu";
import { SidebarMenuItem } from "#react/sidebar/sidebar-menu-item";

/** True when the entry is somewhere to go or something to run, and not only the heading of its children. */
const isLink = (item: NavigationItem): boolean =>
  item.href !== undefined || item.onPress !== undefined;

/** True when a top-level entry is a group heading. */
const isGroup = (item: NavigationItem): boolean =>
  !isLink(item) && (item.children?.length ?? 0) > 0;

/** One entry and its sub-menu. */
function Entry({
  item,
  isFiltered,
}: {
  readonly item: NavigationItem;
  readonly isFiltered: boolean;
}): ReactElement {
  const children = item.children ?? [];
  return (
    <SidebarMenuItem
      label={item.label}
      icon={item.icon}
      href={item.href}
      onPress={item.onPress}
      isActive={item.isCurrent}
      isDisabled={item.isDisabled}
      badge={item.badge}
      shortcut={item.shortcut}
      {...(isFiltered ? { isOpen: true } : {})}
    >
      {children.length === 0
        ? undefined
        : children.map((child) => <Entry key={child.id} item={child} isFiltered={isFiltered} />)}
    </SidebarMenuItem>
  );
}

/** The `items` as groups, menus and entries. */
export function SidebarItems({ items, isFiltered }: SidebarItemsProps): ReactElement {
  // Runs of plain entries become one unlabelled group each; a group heading becomes a group of its own.
  const blocks: { key: string; label?: string; entries: readonly NavigationItem[] }[] = [];
  for (const item of items) {
    if (isGroup(item))
      blocks.push({ key: item.id, label: item.label, entries: item.children ?? [] });
    else {
      const last = blocks.at(-1);
      if (last !== undefined && last.label === undefined) last.entries = [...last.entries, item];
      else blocks.push({ key: item.id, entries: [item] });
    }
  }
  return (
    <>
      {blocks.map((block) => (
        <SidebarGroup
          key={block.key}
          {...(block.label === undefined ? {} : { label: block.label })}
        >
          <SidebarMenu>
            {block.entries.map((item) => (
              <Entry key={item.id} item={item} isFiltered={isFiltered} />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}

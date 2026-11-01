/**
 * Stackra file contract:
 * Purpose: `useMenuShortcuts(sections, onAction)`, which registers every enabled menu action that has a key binding
 *          (`shortcut: "mod+e"`), submenu actions included, with the nearest `ShortcutProvider` while the menu's root is
 *          mounted, so the key runs the action while the menu is closed: its `onPress`, then `onAction` with its id.
 * Boundary: an older ready-made hint (`⌘E`) does not parse and stays a hint only. A link-only action (`href`, no
 *           handler) is not registered: following a link needs the router. Shared by Menu (and so ActionMenu and
 *           ContextMenu) and Menubar.
 * Runtime: browser
 * Governing contract: ADR 0508 (one action definition; menu items are shortcut-aware).
 */
import { normalizeShortcutKeys, type ShortcutAction } from "@stackra/shortcuts";
import { useShortcutActions } from "@stackra/shortcuts/react";

import type { MenuSection } from "#contracts/types/menu-section.type";

/** Whether `keys` is a binding, not an older display text. */
const parses = (keys: string): boolean => {
  try {
    normalizeShortcutKeys(keys);
    return true;
  } catch {
    return false;
  }
};

/**
 * Registers the menu's bound actions.
 *
 * @example
 * useMenuShortcuts(sections, onAction);
 */
export function useMenuShortcuts(
  sections: readonly MenuSection[],
  onAction: ((id: string) => void) | undefined,
): void {
  const actions: ShortcutAction[] = [];
  for (const section of sections)
    for (const item of section.items)
      for (const leaf of [item, ...(item.items ?? [])]) {
        if (leaf.shortcut === undefined || !parses(leaf.shortcut)) continue;
        if (leaf.onPress === undefined && onAction === undefined) continue;
        actions.push({
          id: leaf.id,
          label: leaf.label,
          shortcut: leaf.shortcut,
          group: section.isTitleHidden ? undefined : section.title,
          isDisabled: leaf.isDisabled,
          run: () => {
            leaf.onPress?.();
            onAction?.(leaf.id);
          },
        });
      }
  useShortcutActions(actions);
}

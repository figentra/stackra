/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/keyboard-shortcuts` (Keyboard shortcuts): the shortcut-aware UI of ADR 0508,
 *          the key hint, the `?` cheat sheet and the shortcut settings panel.
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; ADR 0508; STA-1371.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Keyboard shortcuts entry of the component registry. */
export const FREE_KEYBOARD_SHORTCUTS: ComponentEntry = {
  slug: "keyboard-shortcuts",
  tier: "free",
  category: "actions",
  platforms: ["react"],
  packageName: "@stackra/ui",
  exportName: "ShortcutCheatSheet",
  parts: ["ShortcutCheatSheet", "ShortcutHint", "ShortcutSettingsPanel"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "kbd",
      docsUrl: "https://www.heroui.com/docs/react/components/kbd",
      sourceUrl: "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/kbd",
    },
  },
  examples: [
    { id: "toolbar", card: true },
    { id: "modes" },
    { id: "reveal" },
    { id: "cheat-sheet" },
    { id: "settings" },
  ],
  related: ["free/command-palette", "free/button", "free/tooltip"],
  tokens: ["color.surface", "radius.sm"],
  keywords: ["keyboard shortcuts", "hotkeys", "kbd", "cheat sheet", "remap", "aria-keyshortcuts"],
  status: "new",
};

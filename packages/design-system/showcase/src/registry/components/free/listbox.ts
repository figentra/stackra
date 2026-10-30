/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/listbox` (Listbox).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave A, owner request 2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Listbox. */
export const FREE_LISTBOX: ComponentEntry = {
  slug: "listbox",
  tier: "free",
  category: "selection",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Listbox",
  parts: ["Listbox"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "list-box",
      docsUrl: "https://www.heroui.com/docs/react/components/list-box",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/list-box",
    },
  },
  examples: [
    { id: "branch", card: true },
    { id: "access" },
    { id: "arabic", platforms: ["react"] },
  ],
  related: ["free/select", "free/checkbox-group", "free/radio-group"],
  tokens: ["color.accent-soft", "radius.container"],
  keywords: [
    "listbox",
    "list box",
    "options",
    "single select",
    "multi select",
    "checkmarks",
    "sections",
  ],
  status: "new",
};

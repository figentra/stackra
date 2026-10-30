/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/sidebar` (Sidebar).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Sidebar. */
export const FREE_SIDEBAR: ComponentEntry = {
  slug: "sidebar",
  tier: "free",
  category: "navigation",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Sidebar",
  parts: [
    "Sidebar",
    "Sidebar.Provider",
    "Sidebar.Header",
    "Sidebar.Content",
    "Sidebar.Group",
    "Sidebar.Menu",
    "Sidebar.MenuItem",
    "Sidebar.MenuSkeleton",
    "Sidebar.Separator",
    "Sidebar.Footer",
    "Sidebar.Search",
    "Sidebar.Rail",
    "Sidebar.Trigger",
    "Sidebar.Inset",
  ],
  hero: {},
  examples: [
    { id: "expanded", card: true },
    { id: "collapsed" },
    { id: "offcanvas" },
    { id: "floating" },
    { id: "inset" },
    { id: "nested" },
    { id: "badges" },
    { id: "current" },
    { id: "header-footer" },
    { id: "resizable" },
    { id: "search" },
    { id: "loading" },
    { id: "no-toggle" },
    { id: "live" },
    { id: "arabic" },
  ],
  related: ["free/app-shell", "free/drawer", "free/navigation-list"],
  tokens: ["color.accent", "radius.field", "motion.duration"],
  keywords: ["side nav", "menu", "drawer", "rail", "collapse", "app shell"],
};

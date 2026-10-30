/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/app-shell` (App shell).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** App shell. */
export const FREE_APP_SHELL: ComponentEntry = {
  slug: "app-shell",
  tier: "free",
  category: "layout",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "AppShell",
  parts: ["AppShell"],
  hero: {},
  examples: [
    { id: "frame", card: true },
    { id: "breakpoint" },
    { id: "bare" },
    { id: "arabic" },
    { id: "live" },
  ],
  related: ["free/app-header", "free/page-header", "free/screen"],
  tokens: ["color.background", "color.surface", "spacing.page"],
  keywords: ["layout", "frame", "shell"],
};

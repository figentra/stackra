/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/kiosk-surface` (Kiosk surface).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (unregistered exports, owner approval
 *          2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The KioskSurface entry of the component registry. */
export const FREE_KIOSK_SURFACE: ComponentEntry = {
  slug: "kiosk-surface",
  tier: "free",
  category: "layout",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "KioskSurface",
  parts: ["KioskSurface"],
  hero: {},
  examples: [
    { id: "idle", card: true },
    { id: "reach", platforms: ["react"] },
  ],
  related: ["free/app-shell", "free/button"],
  tokens: ["color.foreground", "color.focus"],
  keywords: ["kiosk", "self-service", "idle reset", "unattended", "accessibility"],
  status: "new",
};

/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/holo-card` (Holo card).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave 3b: data and dashboard).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Holo card. */
export const FREE_HOLO_CARD: ComponentEntry = {
  slug: "holo-card",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "HoloCard",
  parts: ["HoloCard"],
  hero: {},
  examples: [{ id: "membership", card: true }],
  related: ["free/card", "free/kpi", "free/avatar"],
  tokens: ["color.surface", "shadow.lg", "radius.2xl"],
  keywords: ["holographic", "tilt", "membership card", "loyalty", "3d card", "reward"],
  status: "new",
};

/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/meter` (Meter).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave A, owner request 2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Meter. */
export const FREE_METER: ComponentEntry = {
  slug: "meter",
  tier: "free",
  category: "feedback_and_status",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Meter",
  parts: ["Meter"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "meter",
      docsUrl: "https://www.heroui.com/docs/react/components/meter",
      sourceUrl: "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/meter",
    },
  },
  examples: [
    { id: "servers", card: true },
    { id: "score" },
    { id: "arabic", platforms: ["react"] },
  ],
  related: ["free/progress-bar", "free/stacked-meter", "free/slider"],
  tokens: ["color.success", "color.warning", "color.danger"],
  keywords: ["meter", "gauge", "level", "quota", "storage", "score", "capacity"],
  status: "new",
};

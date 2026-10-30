/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/system-banner` (System banner).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; gap inventory row 27 (owner approval 2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** System banner. */
export const FREE_SYSTEM_BANNER: ComponentEntry = {
  slug: "system-banner",
  tier: "free",
  category: "feedback_and_status",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "SystemBanner",
  parts: ["SystemBanner"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "alert",
      docsUrl: "https://www.heroui.com/docs/react/components/alert",
      sourceUrl: "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/alert",
    },
    native: {
      pkg: "heroui-native",
      slug: "alert",
      docsUrl: "https://www.heroui.com/docs/native/components/alert",
      sourceUrl: "https://github.com/heroui-inc/heroui-native/tree/main/src/components/alert",
    },
  },
  examples: [{ id: "tones", card: true }, { id: "dismiss" }, { id: "actions" }],
  related: ["free/alert", "free/environment-banner", "free/toast"],
  tokens: ["color.accent", "color.warning", "color.danger"],
  keywords: ["banner", "announcement", "outage", "notice"],
};

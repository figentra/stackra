/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/alert` (Alert).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Alert entry of the component registry. */
export const FREE_ALERT: ComponentEntry = {
  slug: "alert",
  tier: "free",
  category: "feedback_and_status",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Alert",
  parts: ["Alert"],
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
  examples: [
    { id: "tones", card: true },
    { id: "parts", platforms: ["react"] },
    { id: "live" },
    { id: "plain", platforms: ["native"] },
    { id: "icons", platforms: ["native"] },
    { id: "actions", platforms: ["native"] },
  ],
  related: ["free/empty-state", "free/environment-banner", "free/error-state"],
  tokens: ["color.success", "color.warning", "color.danger"],
  haptics: [{ event: "done", style: "success" }],
  keywords: ["callout", "notice", "banner", "message"],
};

/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/spinner` (Spinner).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Spinner. */
export const FREE_SPINNER: ComponentEntry = {
  slug: "spinner",
  tier: "free",
  category: "feedback_and_status",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Spinner",
  parts: ["Spinner"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "spinner",
      docsUrl: "https://www.heroui.com/docs/react/components/spinner",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/spinner",
    },
    native: {
      pkg: "heroui-native",
      slug: "spinner",
      docsUrl: "https://www.heroui.com/docs/native/components/spinner",
      sourceUrl: "https://github.com/heroui-inc/heroui-native/tree/main/src/components/spinner",
    },
  },
  examples: [
    { id: "sizes" },
    { id: "tones" },
    { id: "beside", card: true },
    { id: "speed", platforms: ["react"] },
    { id: "action" },
  ],
  related: ["free/skeleton", "free/status-badge", "free/toast"],
  tokens: ["color.success", "color.warning", "color.danger"],
  haptics: [{ event: "done", style: "success" }],
  keywords: ["loading", "busy", "activity"],
};

/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/toast` (Toast).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Toast. */
export const FREE_TOAST: ComponentEntry = {
  slug: "toast",
  tier: "free",
  category: "feedback_and_status",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "toast",
  parts: ["toast", "toast.Item", "toast.Provider"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "toast",
      docsUrl: "https://www.heroui.com/docs/react/components/toast",
      sourceUrl: "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/toast",
      racUrl: "https://react-spectrum.adobe.com/react-aria/Toast.html",
    },
    native: {
      pkg: "heroui-native",
      slug: "toast",
      docsUrl: "https://www.heroui.com/docs/native/components/toast",
      sourceUrl: "https://github.com/heroui-inc/heroui-native/tree/main/src/components/toast",
    },
  },
  examples: [
    { id: "tones", card: true },
    { id: "options", platforms: ["react"] },
    { id: "control", platforms: ["react"] },
    { id: "detail", platforms: ["native"] },
    { id: "action", platforms: ["native"] },
    { id: "duration", platforms: ["native"] },
    { id: "live", platforms: ["native"] },
    { id: "styles", platforms: ["native"] },
  ],
  related: ["free/status-badge", "free/spinner", "free/skeleton"],
  tokens: ["color.success", "color.warning", "color.danger"],
  haptics: [{ event: "done", style: "success" }],
  keywords: ["snackbar", "notification", "message"],
};

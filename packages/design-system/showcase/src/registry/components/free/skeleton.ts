/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/skeleton` (Skeleton).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Skeleton entry of the component registry. */
export const FREE_SKELETON: ComponentEntry = {
  slug: "skeleton",
  tier: "free",
  category: "feedback_and_status",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Skeleton",
  parts: ["Skeleton"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "skeleton",
      docsUrl: "https://www.heroui.com/docs/react/components/skeleton",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/skeleton",
    },
    native: {
      pkg: "heroui-native",
      slug: "skeleton",
      docsUrl: "https://www.heroui.com/docs/native/components/skeleton",
      sourceUrl: "https://github.com/heroui-inc/heroui-native/tree/main/src/components/skeleton",
    },
  },
  examples: [{ id: "animations", card: true }, { id: "shapes" }, { id: "sweep" }, { id: "cycle" }],
  related: ["free/spinner", "free/status-badge", "free/progress-circle"],
  tokens: ["color.success", "color.warning", "color.danger"],
  haptics: [{ event: "done", style: "success" }],
  keywords: ["loading", "placeholder", "shimmer"],
};

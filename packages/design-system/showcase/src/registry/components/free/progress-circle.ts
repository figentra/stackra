/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/progress-circle` (Progress circle).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Progress circle entry of the component registry. */
export const FREE_PROGRESS_CIRCLE: ComponentEntry = {
  slug: "progress-circle",
  tier: "free",
  category: "feedback_and_status",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "ProgressCircle",
  parts: ["ProgressCircle"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "progress-circle",
      docsUrl: "https://www.heroui.com/docs/react/components/progress-circle",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/progress-circle",
      racUrl: "https://react-spectrum.adobe.com/react-aria/ProgressBar.html",
    },
  },
  examples: [
    { id: "sizes", card: true },
    { id: "tones" },
    { id: "determinate", platforms: ["react"] },
    { id: "indeterminate" },
    { id: "beside", platforms: ["react"] },
    { id: "action", platforms: ["react"] },
    { id: "values", platforms: ["native"] },
    { id: "spoken", platforms: ["native"] },
    { id: "live", platforms: ["native"] },
  ],
  related: ["free/progress-bar", "free/page-skeleton", "free/skeleton"],
  tokens: ["color.success", "color.warning", "color.danger"],
  haptics: [{ event: "done", style: "success" }],
  keywords: ["progress", "ring", "loading"],
};

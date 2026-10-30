/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/progress-bar` (Progress bar).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Progress bar. */
export const FREE_PROGRESS_BAR: ComponentEntry = {
  slug: "progress-bar",
  tier: "free",
  category: "feedback_and_status",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "ProgressBar",
  parts: ["ProgressBar"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "progress-bar",
      docsUrl: "https://www.heroui.com/docs/react/components/progress-bar",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/progress-bar",
      racUrl: "https://react-spectrum.adobe.com/react-aria/ProgressBar.html",
    },
  },
  examples: [
    { id: "sizes" },
    { id: "tones" },
    { id: "determinate", platforms: ["react"] },
    { id: "indeterminate" },
    { id: "text", card: true, platforms: ["react"] },
    { id: "action", platforms: ["react"] },
    { id: "values", platforms: ["native"] },
    { id: "range", platforms: ["native"] },
    { id: "live", platforms: ["native"] },
  ],
  related: ["free/page-skeleton", "free/progress-circle", "free/error-state"],
  tokens: ["color.success", "color.warning", "color.danger"],
  haptics: [{ event: "done", style: "success" }],
  keywords: ["progress", "loading", "meter"],
};

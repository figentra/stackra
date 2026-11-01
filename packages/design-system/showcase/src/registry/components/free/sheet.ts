/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/sheet` (Sheet).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; owner approval 2026-10-31 (STA-1371).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Sheet entry of the component registry. */
export const FREE_SHEET: ComponentEntry = {
  slug: "sheet",
  tier: "free",
  category: "overlays",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Sheet",
  parts: ["Sheet", "Sheet.Header", "Sheet.Title", "Sheet.Body", "Sheet.Footer", "Sheet.Close"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "sheet",
      docsUrl: "https://www.heroui.com/docs/react/components/sheet",
      sourceUrl: "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/sheet",
      racUrl: "https://react-spectrum.adobe.com/react-aria/Sheet.html",
    },
    native: {
      pkg: "heroui-native",
      slug: "bottom-sheet",
      docsUrl: "https://www.heroui.com/docs/native/components/bottom-sheet",
      sourceUrl:
        "https://github.com/heroui-inc/heroui-native/tree/main/src/components/bottom-sheet",
    },
  },
  examples: [
    { id: "basic", card: true },
    { id: "snap" },
    { id: "sequential", platforms: ["react"] },
    { id: "placement", platforms: ["react"] },
    { id: "backdrop" },
    { id: "dismissal", platforms: ["react"] },
    { id: "scrollable", platforms: ["react"] },
    { id: "detached", platforms: ["react"] },
    { id: "controlled", platforms: ["react"] },
    { id: "handle", platforms: ["react"] },
    { id: "nested", platforms: ["react"] },
  ],
  related: ["free/drawer", "free/modal", "free/action-menu"],
  tokens: ["color.overlay", "radius.base", "shadow.overlay"],
  haptics: [{ event: "open", style: "impact" }],
  keywords: ["bottom sheet", "swipe", "snap points", "detents", "nested sheet", "peek"],
};

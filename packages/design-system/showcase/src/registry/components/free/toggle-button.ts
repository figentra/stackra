/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/toggle-button` (Toggle button).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3c mobile interactions (owner approval
 *          2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Toggle button. */
export const FREE_TOGGLE_BUTTON: ComponentEntry = {
  slug: "toggle-button",
  tier: "free",
  category: "selection",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "ToggleButton",
  parts: ["ToggleButton", "ToggleButtonGroup"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "toggle-button",
      docsUrl: "https://www.heroui.com/docs/react/components/toggle-button",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/toggle-button",
      racUrl: "https://react-spectrum.adobe.com/react-aria/ToggleButton.html",
    },
  },
  examples: [{ id: "basics", card: true }, { id: "group" }],
  related: ["free/button", "free/switch", "free/segmented-control"],
  tokens: ["color.accent", "radius.field"],
  haptics: [{ event: "toggle", style: "impact" }],
  keywords: ["toggle", "pressed", "toolbar", "format"],
  status: "new",
};

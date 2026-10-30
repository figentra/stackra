/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/form` (Form).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Form. */
export const FREE_FORM: ComponentEntry = {
  slug: "form",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Form",
  parts: ["Form"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "form",
      docsUrl: "https://www.heroui.com/docs/react/components/form",
      sourceUrl: "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/form",
      racUrl: "https://react-spectrum.adobe.com/react-aria/https.html",
    },
  },
  examples: [
    { id: "label" },
    { id: "description", card: true },
    { id: "field-error" },
    { id: "live" },
  ],
  related: ["free/form-field", "free/form-section", "free/input-group"],
  tokens: ["color.field", "radius.field", "color.focus"],
  haptics: [{ event: "invalid", style: "error" }],
  keywords: ["form", "submit", "validation"],
};

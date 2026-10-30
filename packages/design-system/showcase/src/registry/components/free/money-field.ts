/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/money-field` (Money field), built from the P1 gap list (owner decision 2026-10-28).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Money field. */
export const FREE_MONEY_FIELD: ComponentEntry = {
  slug: "money-field",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "MoneyField",
  parts: ["MoneyField"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "number-field",
      docsUrl: "https://www.heroui.com/docs/react/components/number-field",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/number-field",
      racUrl: "https://react-spectrum.adobe.com/react-aria/NumberField.html",
    },
  },
  examples: [{ id: "basics", card: true }, { id: "currencies" }, { id: "limit" }],
  related: ["free/mode-switch", "free/number-field", "free/input-group"],
  tokens: ["color.field", "radius.field", "color.focus"],
  haptics: [
    { event: "step", style: "impact" },
    { event: "invalid", style: "error" },
  ],
  keywords: ["money", "currency", "amount", "price"],
};

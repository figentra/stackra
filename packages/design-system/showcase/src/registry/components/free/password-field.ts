/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/password-field` (Password field), built from the P1 gap list (owner decision 2026-10-28).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Password field entry of the component registry. */
export const FREE_PASSWORD_FIELD: ComponentEntry = {
  slug: "password-field",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "PasswordField",
  parts: ["PasswordField"],
  hero: {
    react: {
      pkg: "@heroui/react",
      slug: "input-group",
      docsUrl: "https://www.heroui.com/docs/react/components/input-group",
      sourceUrl:
        "https://github.com/heroui-inc/heroui/tree/v3/packages/react/src/components/input-group",
    },
    native: {
      pkg: "heroui-native",
      slug: "input-group",
      docsUrl: "https://www.heroui.com/docs/native/components/input-group",
      sourceUrl: "https://github.com/heroui-inc/heroui-native/tree/main/src/components/input-group",
    },
  },
  examples: [{ id: "basics", card: true }, { id: "pin" }, { id: "states" }],
  related: ["free/number-field", "free/search-field", "free/text-area"],
  tokens: ["color.field", "radius.field", "color.focus"],
  haptics: [
    { event: "invalid", style: "error" },
    { event: "accepted", style: "success" },
  ],
  keywords: ["password", "pin", "secret", "reveal"],
};

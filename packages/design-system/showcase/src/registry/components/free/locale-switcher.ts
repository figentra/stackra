/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/locale-switcher` (Language switcher).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3a forms and pickers (owner approval 2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Language switcher entry of the component registry. */
export const FREE_LOCALE_SWITCHER: ComponentEntry = {
  slug: "locale-switcher",
  tier: "free",
  category: "navigation",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "LocaleSwitcher",
  parts: ["LocaleSwitcher"],
  hero: {},
  examples: [{ id: "basics", card: true }],
  related: ["free/select"],
  tokens: ["radius.field"],
  keywords: ["language", "locale", "arabic", "translation"],
  status: "new",
};

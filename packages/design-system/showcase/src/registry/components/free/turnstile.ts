/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/turnstile` (Turnstile).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (unregistered exports, owner approval
 *          2026-10-29).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Turnstile entry of the component registry. */
export const FREE_TURNSTILE: ComponentEntry = {
  slug: "turnstile",
  tier: "free",
  category: "inputs_and_forms",
  platforms: ["react"],
  packageName: "@stackra/ui",
  exportName: "Turnstile",
  parts: ["Turnstile"],
  hero: {},
  examples: [{ id: "basics", card: true }, { id: "blocked" }],
  related: ["free/form", "free/form-field"],
  tokens: ["radius.field"],
  keywords: ["captcha", "bot check", "cloudflare", "challenge", "spam"],
  status: "new",
};

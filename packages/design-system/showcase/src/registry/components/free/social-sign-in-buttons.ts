/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/social-sign-in-buttons` (Social sign-in buttons).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; wave 3c mobile interactions (owner approval
 *          2026-10-28).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Social sign-in buttons. */
export const FREE_SOCIAL_SIGN_IN_BUTTONS: ComponentEntry = {
  slug: "social-sign-in-buttons",
  tier: "free",
  category: "actions",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "SocialSignInButtons",
  parts: ["SocialSignInButtons"],
  hero: {},
  examples: [{ id: "basics", card: true }],
  related: ["free/button", "free/account-connection"],
  tokens: ["color.border", "radius.field"],
  keywords: ["sign in", "login", "apple", "google", "oauth"],
  status: "new",
};

/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/environment-banner` (Environment banner).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** Environment banner. */
export const FREE_ENVIRONMENT_BANNER: ComponentEntry = {
  slug: "environment-banner",
  tier: "free",
  category: "feedback_and_status",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "EnvironmentBanner",
  parts: ["EnvironmentBanner"],
  hero: {},
  examples: [
    { id: "demo", platforms: ["react"], card: true },
    { id: "title", platforms: ["native"] },
  ],
  related: ["free/empty-state", "free/error-state", "free/alert"],
  tokens: ["color.success", "color.warning", "color.danger"],
  haptics: [{ event: "done", style: "success" }],
  keywords: ["staging", "environment", "dev"],
};

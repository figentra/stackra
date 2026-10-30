/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/marquee` (Marquee).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The Marquee entry of the component registry. */
export const FREE_MARQUEE: ComponentEntry = {
  slug: "marquee",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "Marquee",
  parts: ["Marquee"],
  // HeroUI has no marquee; this one is a Web Animations loop on web and a Reanimated frame loop on native.
  hero: {},
  examples: [{ id: "brands", card: true }, { id: "announcements" }],
  related: ["free/carousel", "free/system-banner", "free/thumbnail"],
  tokens: ["motion.duration", "color.focus"],
  keywords: ["marquee", "ticker", "logo strip", "scrolling text", "announcement bar"],
  status: "new",
};

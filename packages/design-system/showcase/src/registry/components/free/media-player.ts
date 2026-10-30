/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/media-player` (MediaPlayer).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave D, owner approval 2026-10-30;
 *          native on expo-video, owner approval 2026-10-30).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The MediaPlayer entry of the component registry. */
export const FREE_MEDIA_PLAYER: ComponentEntry = {
  slug: "media-player",
  tier: "free",
  category: "data_display",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "MediaPlayer",
  parts: ["MediaPlayer"],
  // HeroUI has no media player; this one draws the house controls over the browser's video and audio elements, and
  // over expo-video on native.
  hero: {},
  examples: [{ id: "video", card: true }, { id: "audio" }],
  related: ["free/slider", "free/icon-button", "free/menu"],
  tokens: ["color.accent", "color.surface", "radius.container"],
  keywords: ["video", "audio", "player", "captions", "playback", "media"],
  status: "new",
};

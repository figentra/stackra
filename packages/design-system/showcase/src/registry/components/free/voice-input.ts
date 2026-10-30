/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/voice-input` (VoiceInput).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The VoiceInput entry of the component registry. */
export const FREE_VOICE_INPUT: ComponentEntry = {
  slug: "voice-input",
  tier: "free",
  category: "ai",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "VoiceInput",
  parts: ["VoiceInput"],
  // HeroUI has no voice input; this one is the house IconButton over a VoiceRecorderPort driver.
  hero: {},
  examples: [{ id: "basics", card: true }, { id: "dictation" }, { id: "denied" }],
  related: ["free/icon-button", "free/text-area", "free/ai-mark"],
  tokens: ["color.accent", "color.danger", "color.focus"],
  keywords: ["voice", "microphone", "mic", "record", "dictation", "speech", "audio"],
  status: "new",
};

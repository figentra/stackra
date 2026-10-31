/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/prompt-input` (PromptInput).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (component gaps, owner approval
 *          2026-10-31).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The PromptInput entry of the component registry. */
export const FREE_PROMPT_INPUT: ComponentEntry = {
  slug: "prompt-input",
  tier: "free",
  category: "ai",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "PromptInput",
  parts: ["PromptInput"],
  // HeroUI has no composer; this one is a text box, our IconButton and the caller's toolbar parts.
  hero: {},
  examples: [{ id: "composer", card: true }, { id: "streaming" }],
  related: ["free/model-picker", "free/voice-input", "free/prompt-suggestions"],
  tokens: ["color.surface", "color.border", "color.accent", "color.focus", "radius.container"],
  keywords: ["ai", "chat", "composer", "prompt", "send", "stop", "message input"],
  status: "new",
};

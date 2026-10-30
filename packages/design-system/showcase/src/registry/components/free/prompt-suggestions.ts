/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/prompt-suggestions` (PromptSuggestions).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The PromptSuggestions entry of the component registry. */
export const FREE_PROMPT_SUGGESTIONS: ComponentEntry = {
  slug: "prompt-suggestions",
  tier: "free",
  category: "ai",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "PromptSuggestions",
  parts: ["PromptSuggestions"],
  // HeroUI has no prompt suggestions; these are React Aria buttons drawn as cards or pills.
  hero: {},
  examples: [{ id: "cards", card: true }, { id: "chips", platforms: ["react"] }, { id: "scroll" }],
  related: ["free/chip", "free/button", "free/ai-mark"],
  tokens: ["color.surface", "color.focus"],
  keywords: ["ai", "chat", "prompts", "suggestions", "starters", "chips"],
  status: "new",
};

/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/model-picker` (ModelPicker).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The ModelPicker entry of the component registry. */
export const FREE_MODEL_PICKER: ComponentEntry = {
  slug: "model-picker",
  tier: "free",
  category: "ai",
  platforms: ["react", "native"],
  packageName: "@stackra/ui",
  exportName: "ModelPicker",
  parts: ["ModelPicker"],
  // Built on HeroUI's Select (web) and HeroUI Native's Select (native), with rich rows grouped by provider.
  hero: {},
  examples: [{ id: "basics", card: true }, { id: "compact" }],
  related: ["free/select", "free/ai-mark", "free/chip"],
  tokens: ["color.field", "color.accent-soft", "color.warning", "radius.field"],
  keywords: ["ai", "model", "llm", "provider", "select", "assistant"],
  status: "new",
};

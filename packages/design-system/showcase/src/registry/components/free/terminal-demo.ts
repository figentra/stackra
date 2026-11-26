/**
 * Stackra file contract:
 * Purpose: the registry entry of `free/terminal-demo` (TerminalDemo).
 * Boundary: data only; its words live in `assets/lang/{en,ar}/showcase.json`, its API in the generated `api/`.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; STA-2041 (the Stackra landing, W4).
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The TerminalDemo entry of the component registry. */
export const FREE_TERMINAL_DEMO: ComponentEntry = {
  slug: "terminal-demo",
  tier: "free",
  category: "data_display",
  platforms: ["react"],
  packageName: "@stackra/ui",
  exportName: "TerminalDemo",
  parts: ["TerminalDemo"],
  // HeroUI has no terminal; recorded sessions played a whole line at a time.
  hero: {},
  examples: [{ id: "create", card: true }, { id: "verify" }],
  related: ["free/code-block", "free/copy-button", "free/frame"],
  tokens: ["font.mono", "color.surface-secondary", "color.accent"],
  keywords: ["terminal", "cli", "shell", "command line", "recording", "try it", "demo"],
  status: "new",
};

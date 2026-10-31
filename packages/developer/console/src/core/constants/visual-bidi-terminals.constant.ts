/**
 * Stackra file contract:
 * Purpose: `VISUAL_BIDI_TERMINALS`, the `TERM_PROGRAM` values of terminals that neither reorder right-to-left text
 *          nor shape Arabic (xterm.js based, and iTerm2 by default), so the console writes those runs in visual order.
 * Boundary: data only; `STACKRA_BIDI=visual|logical` overrides it either way. A terminal not listed gets logical text.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-026.
 */

/** Terminals that need visual order. */
export const VISUAL_BIDI_TERMINALS: ReadonlySet<string> = new Set([
  "claude-desktop",
  "vscode",
  "iTerm.app",
  "Hyper",
  "Tabby",
]);

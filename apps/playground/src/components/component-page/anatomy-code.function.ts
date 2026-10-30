/**
 * Stackra file contract:
 * Purpose: `anatomyCode`, the compound code block of an entry: the root part around its children, one per line.
 * Boundary: a pure function; the same text the Anatomy block and Copy Markdown show.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (row 5).
 */
import type { ComponentEntry } from "@stackra/showcase";

/** `<Tabs>\n  <Tabs.List />\n</Tabs>` for `entry`. */
export function anatomyCode(entry: Pick<ComponentEntry, "parts">): string {
  const [root, ...children] = entry.parts;
  return [`<${root}>`, ...children.map((part) => `  <${part} />`), `</${root}>`].join("\n");
}

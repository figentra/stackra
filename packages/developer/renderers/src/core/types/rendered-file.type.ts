/**
 * Stackra file contract:
 * Purpose: `RenderedFile`, one file a renderer produced: its path relative to the assistant's root and its full text.
 * Boundary: type only; the caller decides the root (`.claude/`, `~/.claude/`, a plugin folder) and writes the file.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decision 10: setup and sync write different places).
 */

/** One rendered file. */
export type RenderedFile = {
  /** Forward-slash path relative to the assistant's root (`skills/naming/SKILL.md`, `AGENTS.md`). */
  readonly path: string;
  /** The whole file, ending in one newline. */
  readonly content: string;
};

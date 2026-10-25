/**
 * Stackra file contract:
 * Purpose: `SkillDocument`, a parsed skill: its name (the folder holding `SKILL.md`), when to use it, and its Markdown
 *          body.
 * Boundary: type only; `parseAgentDocument("skill", …)` returns it.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decisions 2 and 6).
 */

/** One skill an assistant loads on demand. */
export type SkillDocument = {
  /** The document kind, always `skill`. */
  readonly kind: "skill";
  /** Kebab-case, from the folder that holds `SKILL.md`. */
  readonly name: string;
  /** What the skill does and when an assistant should load it. */
  readonly description: string;
  /** The Markdown after the frontmatter. */
  readonly body: string;
  /** The file path the document was parsed from, as given. */
  readonly source: string;
};

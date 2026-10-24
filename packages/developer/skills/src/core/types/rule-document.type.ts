/**
 * Stackra file contract:
 * Purpose: `RuleDocument`, a parsed rule: always on (`always`), scoped to the files its `globs` match, or read on
 *          request when it has neither.
 * Boundary: type only; `parseAgentDocument("rule", …)` returns it.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decisions 2 and 6).
 */

/** One rule an assistant always or conditionally loads. */
export type RuleDocument = {
  /** The document kind, always `rule`. */
  readonly kind: "rule";
  /** Kebab-case, from the file name. */
  readonly name: string;
  /** The heading renderers show. */
  readonly title: string;
  /** One line on what the rule governs. */
  readonly description: string;
  /** Loaded into every session. */
  readonly always: boolean;
  /** File globs that load the rule when a matching file is touched; empty for none. */
  readonly globs: readonly string[];
  /** The Markdown after the frontmatter. */
  readonly body: string;
  /** The file path the document was parsed from, as given. */
  readonly source: string;
};

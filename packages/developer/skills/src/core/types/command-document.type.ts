/**
 * Stackra file contract:
 * Purpose: `CommandDocument`, a parsed command the user types (`/<name>`): what it does, an optional argument hint,
 *          and the prompt body.
 * Boundary: type only; `parseAgentDocument("command", …)` returns it.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decision 2).
 */

/** One slash command an assistant offers. */
export type CommandDocument = {
  /** The document kind, always `command`. */
  readonly kind: "command";
  /** Kebab-case, from the file name; the user types `/<name>`. */
  readonly name: string;
  /** One line on what the command does. */
  readonly description: string;
  /** The arguments shown after the name (`<issue-key>`), when it takes any. */
  readonly argumentHint?: string;
  /** The Markdown after the frontmatter: the prompt the command sends. */
  readonly body: string;
  /** The file path the document was parsed from, as given. */
  readonly source: string;
};

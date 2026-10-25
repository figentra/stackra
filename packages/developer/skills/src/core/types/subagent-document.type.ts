/**
 * Stackra file contract:
 * Purpose: `SubagentDocument`, a parsed sub-agent definition: when to delegate to it, the tools it may use, and its
 *          instructions. It names no model; each assistant picks its own.
 * Boundary: type only; `parseAgentDocument("subagent", …)` returns it.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decision 2).
 */

/** One sub-agent an assistant can delegate to. */
export type SubagentDocument = {
  /** The document kind, always `subagent`. */
  readonly kind: "subagent";
  /** Kebab-case, from the file name. */
  readonly name: string;
  /** What the sub-agent does and when to delegate to it. */
  readonly description: string;
  /** Tool names it may use; empty means the assistant's default set. */
  readonly tools: readonly string[];
  /** The Markdown after the frontmatter: the sub-agent's instructions. */
  readonly body: string;
  /** The file path the document was parsed from, as given. */
  readonly source: string;
};

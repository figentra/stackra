/**
 * Stackra file contract:
 * Purpose: `AgentSourceInput`, what `checkAgentSources` reads: the agent files, `routing.yaml` and `models.yaml`, and
 *          an existence predicate for the paths an agent body names.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0258; STA-2098 (H6).
 */

/** The agent sources and the files they are checked against. */
export type AgentSourceInput = {
  /** Each `.agents/agents/<id>.md`, repository-relative, with its text. */
  readonly agents: readonly { readonly path: string; readonly text: string }[];

  /** `.agents/routing.yaml`'s text, when there is one. */
  readonly routing?: string;

  /** `.agents/models.yaml`'s text, when there is one. */
  readonly models?: string;

  /** Whether a repository-relative path exists. */
  readonly exists: (path: string) => boolean;
};

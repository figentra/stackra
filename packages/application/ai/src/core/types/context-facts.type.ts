/**
 * Stackra file contract:
 * Purpose: `ContextFacts`, what a facts class's `provide` returns for an agent's context window: one sentence and the
 *          facts behind it.
 * Boundary: a type only. The MCP gateway in the ai service places it in the context under its token budget and exposes
 *           it as an MCP resource; it is model input, so it holds public ids and what the principal may read, never a
 *           secret or a database id (ADR 0156 guardrails).
 * Runtime: isomorphic
 * Governing contract: ADR 0245 (decision 7, as amended by ADR 0294); ADR 0156 (decision 4).
 */

/** Facts about one record for an agent. */
export interface ContextFacts {
  /** One sentence the agent can repeat, in the conversation's language. */
  readonly summary: string;

  /** The details, serialised to JSON for the model (a view plus what the agent may do next, such as `canCancel`). */
  readonly facts: Readonly<Record<string, unknown>>;
}

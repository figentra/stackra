/**
 * Stackra file contract:
 * Purpose: `ToolHints`, the four MCP tool annotations gen derives for a tool entry of the manifest.
 * Boundary: a type only; `toolHints` computes it, and the MCP gateway passes it on as the tool's `annotations`.
 * Runtime: isomorphic
 * Governing contract: ADR 0099 (decision 3: hints are derived, never hand-written).
 */

/** The MCP annotations of one tool. */
export type ToolHints = {
  /** L0 or L1: the tool reads only. */
  readonly readOnlyHint: boolean;

  /** L4, or the `irreversible` tag. */
  readonly destructiveHint: boolean;

  /** A query, or an action that declares idempotency. */
  readonly idempotentHint: boolean;

  /** The `external-communication` tag: the tool reaches people or systems outside the tenant. */
  readonly openWorldHint: boolean;
};

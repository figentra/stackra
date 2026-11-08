/**
 * Stackra file contract:
 * Purpose: `toolHints`, the MCP tool annotations of an action or query, derived and never hand-written:
 *          `readOnlyHint` for a query at L0 or L1 (an action always writes), `destructiveHint` for L4
 *          or the `irreversible` tag, `idempotentHint` when a repeat cannot run twice (a query, or an action whose
 *          `idempotency` is `required` or `derived`: `optional` runs a call without a key every time, and `never`
 *          ignores the key), `openWorldHint` for the `external_communication` tag.
 * Boundary: pure; the risk comes from the action's permission, the tags from its `effects` option.
 * Runtime: isomorphic
 * Governing contract: ADR 0099 (decision 3); ADR 0155 (decision 1, as amended by ADR 0360 decision 4).
 */
import type { ToolHints } from "#core/types/tool-hints.type";

/**
 * The MCP hints of one tool.
 *
 * @param tool - its kind, its risk level (`L0` to `L4`), its effect tags and its written `idempotency`, if any.
 * @example
 * toolHints({ kind: "action", risk: "L4", effects: [], idempotency: "required" });
 * // { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }
 */
export function toolHints(tool: {
  readonly kind: "action" | "query";
  readonly risk: string;
  readonly effects: readonly string[];
  readonly idempotency: unknown;
}): ToolHints {
  // An action at L1 still writes: the hint must never let an MCP client skip its confirmation.
  const readOnly = tool.kind === "query" && (tool.risk === "L0" || tool.risk === "L1");
  return {
    readOnlyHint: readOnly,
    destructiveHint: tool.risk === "L4" || tool.effects.includes("irreversible"),
    // An MCP host may retry an idempotent tool on its own; only a key the server requires or derives makes that safe.
    idempotentHint:
      tool.kind === "query" || tool.idempotency === "required" || tool.idempotency === "derived",
    openWorldHint: tool.effects.includes("external_communication"),
  };
}

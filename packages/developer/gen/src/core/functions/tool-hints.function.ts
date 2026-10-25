/**
 * Stackra file contract:
 * Purpose: `toolHints`, the MCP tool annotations of an action or query, derived and never hand-written:
 *          `readOnlyHint` for L0 and L1, `destructiveHint` for L4 or the `irreversible` tag, `idempotentHint` when the
 *          action declares idempotency (a query is always idempotent), `openWorldHint` for the
 *          `external-communication` tag.
 * Boundary: pure; the risk comes from the action's permission, the tags from its `effects` option.
 * Runtime: isomorphic
 * Governing contract: ADR 0099 (decision 3); ADR 0155 (decision 1, as amended by ADR 0360 decision 4).
 */
import type { ToolHints } from "#core/types/tool-hints.type";

/**
 * The MCP hints of one tool.
 *
 * @param tool - its kind, its risk level (`L0` to `L4`), its effect tags and whether it declares idempotency.
 * @example
 * toolHints({ kind: "action", risk: "L4", effects: [], idempotent: true });
 * // { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }
 */
export function toolHints(tool: {
  readonly kind: "action" | "query";
  readonly risk: string;
  readonly effects: readonly string[];
  readonly idempotent: boolean;
}): ToolHints {
  const readOnly = tool.risk === "L0" || tool.risk === "L1";
  return {
    readOnlyHint: readOnly,
    destructiveHint: tool.risk === "L4" || tool.effects.includes("irreversible"),
    idempotentHint: tool.kind === "query" || tool.idempotent,
    openWorldHint: tool.effects.includes("external-communication"),
  };
}

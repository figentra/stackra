/**
 * Stackra file contract:
 * Purpose: `ToolSource`, what an MCP tool is the projection of: a query (a tool by default) or an action (a tool only
 *          with `tool: true`).
 * Boundary: an enum (`Enum.of`) written by gen into each row of the generated tool table (`#stackra/ai`) and read by
 *           the MCP gateway in the ai service. Every tool is one of these two; a hand-written tool does not exist
 *           (ADR 0245 decision 3).
 * Runtime: isomorphic
 * Governing contract: ADR 0155 (decision 1, as amended by ADR 0294); ADR 0245 (decisions 2 and 3); ADR 0305 (rule 28).
 */
import { Enum } from "@stackra/contracts";

/**
 * The kind of class an MCP tool runs.
 *
 * @example
 * { key: "orders.order.get@1", class: "GetOrderQuery", name: "orders_order_get", from: ToolSource.Query, risk: Risk.L0 }
 */
export const ToolSource = Enum.of({
  /** A query: a read, a tool unless it says `tool: false`, called under the caller's own permissions. */
  Query: "query",
  /** An action: a write, a tool only with `tool: true`, approved per its permission's risk. */
  Action: "action",
});

/** One of the values above. */
export type ToolSource = Enum.Value<typeof ToolSource>;

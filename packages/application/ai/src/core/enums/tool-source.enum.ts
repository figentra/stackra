/**
 * Stackra file contract:
 * Purpose: `ToolSource`, what an AI tool is the projection of: a query (a tool by default), an action (a tool by
 *          default when its actors include a user, unless it says `tool: false` with a reason), or a client
 *          declaration of an app (a route, a panel resource, a placement, an anchor or a tour).
 * Boundary: an enum (`Enum.of`) written by gen into each row of the generated tool tables (`#stackra/ai` for server
 *           tools, `#stackra/client-tools` for client tools) and read by the MCP gateway in the ai service and by the
 *           runtime. Every tool is one of these three; a hand-written tool does not exist (ADR 0245 decision 3, as
 *           amended by ADR 0490 decision 1).
 * Runtime: isomorphic
 * Governing contract: ADR 0155 (decision 1, as amended by ADR 0294); ADR 0245 (decisions 2 and 3); ADR 0360 (decision
 *                     4); ADR 0490 (decision 1); ADR 0305 (rule 28); STA-1631.
 */
import { Enum } from "@stackra/contracts";

/**
 * The kind of class an MCP tool runs.
 *
 * @example
 * { key: "orders.order.get@1", class: "GetOrderQuery", name: "orders_order_get", from: ToolSource.Query, risk: Risk.L0 }
 */
export const ToolSource = Enum.of({
  /** A query: a read, a tool by default, called under the caller's own permissions. */
  Query: "query",
  /** An action: a write, a tool by default when its actors include a user, approved per its permission's risk. */
  Action: "action",
  /** A client declaration: a tool that changes only the viewer's screen, always L0 (ADR 0490 decision 2). */
  Client: "client",
});

/** One of the values above. */
export type ToolSource = Enum.Value<typeof ToolSource>;

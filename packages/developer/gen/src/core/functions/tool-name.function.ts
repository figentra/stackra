/**
 * Stackra file contract:
 * Purpose: `toolName`, the derived MCP tool name of an action or a query: its identity without the version, with
 *          underscores for dots (`orders_order_create`).
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 28: the tool name is derived); ADR 0155.
 */

/**
 * The MCP tool name of an action or query identity.
 *
 * @example
 * toolName("orders.order.create@1"); // "orders_order_create"
 */
export function toolName(identity: string): string {
  return identity.replace(/@\d+$/, "").replaceAll(".", "_");
}

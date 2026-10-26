/**
 * Stackra file contract:
 * Purpose: `HostedTool`, one row of the hosted MCP server's tool table: the MCP descriptor (`name`, `description`,
 *          `inputSchema`, `annotations`) plus what the gateway needs to filter, approve and audit a call (the action
 *          key, the member, the permission, its risk and effect tags), and the `ui://` resource it renders in.
 * Boundary: a type only; `toolTable` builds it from committed manifests, never from source.
 * Runtime: isomorphic
 * Governing contract: ADR 0155 (decisions 1 and 4, as amended by ADR 0360 decision 4); ADR 0099 (decisions 2 and 3);
 *                     ADR 0348 (decision 2), STA-784.
 */
import type { Json } from "@stackra/contracts";

/** One tool the hosted server can offer. */
export type HostedTool = {
  /** The MCP tool name gen derived (`orders_order_cancel`). */
  readonly name: string;

  /** The description written on the action, when the manifest carries one. */
  readonly description?: string;

  /** The JSON Schema of the input, with every `$ref` into a manifest's `schemas` inlined. */
  readonly inputSchema: { readonly [key: string]: Json };

  /** The MCP annotations gen derived (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`). */
  readonly annotations: { readonly [hint: string]: boolean };

  /** The action or query identity it calls (`orders.order.cancel@1`). */
  readonly action: string;

  /** The member whose manifest listed it. */
  readonly member: string;

  /** The permission the caller needs. */
  readonly permission: string;

  /** The permission's risk level, `L0` to `L4`. */
  readonly risk: string;

  /** The effect tags the action declares. */
  readonly effects: readonly string[];

  /** The `ui://` resource the tool renders its result in, when it opts into one. */
  readonly ui?: string;

  /** The MCP descriptor's metadata: `ui.resourceUri` when the tool names a `ui://` resource. */
  readonly _meta?: { readonly ui: { readonly resourceUri: string } };
};

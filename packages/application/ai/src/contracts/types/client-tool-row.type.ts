/**
 * Stackra file contract:
 * Purpose: `ClientToolRow`, one client tool as gen writes it into the client tool table: its key and model-facing
 *          name, `from: "client"`, risk `L0`, the handler kind, what it targets, the module that declares it, the
 *          permission that gates it when there is one, and its input JSON Schema.
 * Boundary: a type only, the sibling of a server tool row with `from: client` (ADR 0490 decision 1). Generated from a
 *           module's own declarations, never hand-written; it ships with its module (decision 16). A client tool
 *           changes only the viewer's screen, so its risk is always `L0` (decision 2).
 * Runtime: isomorphic
 * Governing contract: ADR 0490 (decisions 1, 2 and 16); ADR 0245 (decision 3, as amended); STA-1631.
 */
import type { Json } from "@stackra/contracts";

import type { ClientToolKind } from "#contracts/enums/client-tool-kind.enum";

/** One client tool. */
export interface ClientToolRow {
  /** The tool's key, in the action key grammar (`orders.order.list.filter`). */
  readonly key: string;

  /** The tool name the model calls (`orders_order_list_filter`). */
  readonly name: string;

  /** Always `client`: the sibling of a server tool's `query` or `action`. */
  readonly from: "client";

  /** Always `L0`: a client tool changes only the viewer's screen. */
  readonly risk: "L0";

  /** The generated handler it runs. */
  readonly kind: ClientToolKind;

  /** What the handler targets: a route key, a resource key, an action key or an anchor key. */
  readonly target: string;

  /** The key of the module that declares it. */
  readonly module: string;

  /** The permission the caller must hold for the tool to be offered; absent for a tool anyone on the screen may use. */
  readonly permission?: string;

  /** The input's JSON Schema. */
  readonly inputSchema: { readonly [key: string]: Json };
}

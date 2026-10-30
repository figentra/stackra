/**
 * Stackra file contract:
 * Purpose: `ClientToolIR`, one client tool gen derives from an app's frontend declarations: its key and model-facing
 *          name, the handler kind, what it targets, the module that declares it, the permission that gates it and its
 *          input JSON Schema.
 * Boundary: a type only; the structural twin of `@stackra/ai`'s `ClientToolRow` (this package depends on no AI
 *           package), written as `from: "client"` and `risk: "L0"` by `emitClientTools`. A client tool changes only the
 *           viewer's screen (ADR 0490 decision 2).
 * Runtime: isomorphic
 * Governing contract: ADR 0490 (decisions 1, 2 and 16); STA-1631.
 */
import type { Json } from "@stackra/contracts";

/** One derived client tool. */
export interface ClientToolIR {
  /** The key, in the action key grammar (`orders.order.list.filter`, `navigate.order_detail`). */
  readonly key: string;

  /** The handler kind, a `ClientToolKind` code (`navigate`, `list_open`, `filter`, ...). */
  readonly kind: string;

  /** What the handler targets: a route key, a resource key, an action key or an anchor key. */
  readonly target: string;

  /** The key of the module that declares it. */
  readonly module: string;

  /** The permission that gates it, when there is one. */
  readonly permission?: string;

  /** The input's JSON Schema. */
  readonly inputSchema: { readonly [key: string]: Json };
}

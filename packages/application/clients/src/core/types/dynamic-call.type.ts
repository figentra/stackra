/**
 * Stackra file contract:
 * Purpose: `DynamicCall`, a call known only at runtime: the versioned key and route another service registered (an
 *          import target, an export source), with no generated ref.
 * Boundary: a type only; `DynamicClient` turns it into a `ClientRequest`. The route is what the producer registered;
 *           absent, only an in-process transport can make the call.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decisions 3 and 6, and the 2026-10-26 note on dynamic keys).
 */
import type { EndpointOptions } from "@stackra/actions";

/**
 * A registered key and route.
 *
 * @example
 * { key: "orders.order.import_rows@1", kind: "action", endpoint: { method: "POST", path: "/orders/import-rows" } }
 */
export interface DynamicCall {
  /** The producer's versioned key (`orders.order.import_rows@1`). */
  readonly key: string;

  /** `action` or `query`. */
  readonly kind: "action" | "query";

  /** The registered route. */
  readonly endpoint?: EndpointOptions;
}

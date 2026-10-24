/**
 * Stackra file contract:
 * Purpose: `ClientRequest`, one call as a `ClientTransport` receives it: the versioned key, action or query, the route,
 *          the input already validated and encoded to its wire form, the output schema to decode the answer with, and
 *          the caller's own call options.
 * Boundary: a type only, built once per call by the client runtime. `idempotencyKey` and `onBehalfOf` are present only
 *           when the caller passed them; a transport mints the Idempotency-Key of a write that has none. The input is
 *           JSON, so a transport may queue or log it as it is.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decisions 3, 4 and 6); ADR 0138 (the idempotency step); ADR 0142 (drivers).
 */
import type { EndpointOptions } from "@stackra/actions";
import type { Json } from "@stackra/contracts";
import type { ZodType } from "zod";

/**
 * One call handed to a transport.
 *
 * @example
 * { key: "orders.order.cancel@1", kind: "action", endpoint: { method: "PUT", path: "/orders/:orderId/cancel" },
 *   input: { orderId: "ord_01H2J3K4L5M6N7P8Q9R0S1T2V3" }, output: CancelOrderOutput$ }
 */
export interface ClientRequest {
  /** The producer's versioned key (`orders.order.cancel@1`). */
  readonly key: string;

  /** `action` or `query`. */
  readonly kind: "action" | "query";

  /** The route; absent for a call with no HTTP endpoint, which only an in-process transport can make. */
  readonly endpoint?: EndpointOptions;

  /** The validated input in its wire form (dates as ISO strings). */
  readonly input: Json;

  /** The schema that decodes the answer into its code form. */
  readonly output: ZodType;

  /** The caller's Idempotency-Key (a workflow step key); the same key on every attempt. */
  readonly idempotencyKey?: string;

  /** The principal a service acts for; the producer's pipeline checks it. */
  readonly onBehalfOf?: string;

  /** Aborts the call when the caller goes away. */
  readonly signal?: AbortSignal;
}

/**
 * Stackra file contract:
 * Purpose: `RouteActionResult<O>`, how `ctx.action(Action, input)` came out: answered with data, queued offline, or
 *          refused with the producer's refusal (whose field errors `ctx.fieldErrors` maps onto the form).
 * Boundary: a type only. A transport failure is not a result: it rejects, and the error boundary shows it.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 4); ADR 0059 (offline queue); ADR 0140 (refusals).
 */
import type { ClientError } from "@stackra/clients";

/** The outcome of an action a route ran. */
export type RouteActionResult<O> =
  | {
      /** The producer accepted it. */
      readonly ok: true;
      /** Sent and answered. */
      readonly queued: false;
      /** The decoded answer. */
      readonly data: O;
    }
  | {
      /** Accepted by the offline queue, to be sent when the network returns. */
      readonly ok: true;
      /** Queued. */
      readonly queued: true;
    }
  | {
      /** The producer refused it. */
      readonly ok: false;
      /** The refusal. */
      readonly error: ClientError;
    };

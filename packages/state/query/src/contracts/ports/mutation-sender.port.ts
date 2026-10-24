/**
 * Stackra file contract:
 * Purpose: the `MutationSender` port: sends one queued call to its action, with the Idempotency-Key the queue minted
 *          when it was queued, and reports how it went. The generated client (`@stackra/clients`) implements it,
 *          because it knows each action's route, the session, the scope header and the API version.
 * Boundary: an abstract class that is its own token, keyed `query.MutationSender`. The key must reach the server
 *           unchanged on every attempt, so a replay is the same call to the pipeline's idempotency step (the transport's
 *           `idempotencyKey` middleware keeps a key it is given). A throw counts as "not reached": the entry waits.
 * Runtime: isomorphic
 * Governing contract: ADR 0059 (decision 2); ADR 0138 (the idempotency step); ADR 0260 (generated clients); ADR 0294
 *                     (decisions 15 and 16).
 */
import { Port } from "@stackra/contracts";
import type { Json } from "@stackra/contracts";

import type { ReplayOutcome } from "#contracts/types/replay-outcome.type";

/**
 * Sends queued calls.
 *
 * @example
 * export class ClientMutationSenderDriver extends Driver(MutationSender) {
 *   async send(action: string, input: Json, idempotencyKey: string): Promise<ReplayOutcome> {
 *     return this.client.replay(action, input, idempotencyKey);
 *   }
 * }
 */
export abstract class MutationSender extends Port {
  /** Type-only port key, so `DriverName<MutationSender>` narrows to this port's drivers. */
  declare readonly "~key": "query.MutationSender";

  /**
   * Sends `input` to the action keyed `action` (`orders.order.create@1`) with `idempotencyKey` as its Idempotency-Key.
   *
   * @throws Error when the server cannot be reached; the queue treats it as `{ ok: false, code: null }`.
   */
  abstract send(action: string, input: Json, idempotencyKey: string): Promise<ReplayOutcome>;
}

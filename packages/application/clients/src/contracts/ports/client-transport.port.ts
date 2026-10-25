/**
 * Stackra file contract:
 * Purpose: the `ClientTransport` port: how a generated client reaches its producer. `send` makes a call and resolves
 *          its decoded answer; `queue` hands a call to the producer's queue (a queued call) and resolves once accepted.
 * Boundary: an abstract class that is its own token, keyed `clients.ClientTransport`. Topology picks the driver, so the
 *           consumer's code is the same in process and over the network (ADR 0260 decision 6); this package ships the
 *           HTTP driver. A driver rejects with a refusal decoded from the producer's envelope or a `TransportError`,
 *           never with a raw `Response` or a status code.
 * Runtime: isomorphic
 * Governing contract: ADR 0142 (transport through drivers); ADR 0260 (decisions 4 and 6); ADR 0140 (envelope); ADR 0294
 *                     (decisions 15 and 16).
 */
import { Port } from "@stackra/contracts";

import type { ClientRequest } from "#contracts/types/client-request.type";

/**
 * Sends generated-client calls.
 *
 * @example
 * export class InProcessClientTransportDriver extends Driver(ClientTransport) {
 *   send(request: ClientRequest): Promise<unknown> {
 *     return this.pipeline.call(request.key, request.input);
 *   }
 * }
 */
export abstract class ClientTransport extends Port {
  /** Type-only port key, so `DriverName<ClientTransport>` narrows to this port's drivers. */
  declare readonly "~key": "clients.ClientTransport";

  /**
   * Makes the call and resolves its answer, decoded with `request.output`.
   *
   * @throws Refusal the producer's refusal, decoded from its envelope.
   * @throws TransportError when the producer was not reached or answered something unreadable.
   */
  abstract send(request: ClientRequest): Promise<unknown>;

  /**
   * Hands the call to the producer's queue, which runs it at least once, deduplicated by its Idempotency-Key.
   *
   * @throws Refusal when the producer refuses to queue it (the input, the caller's permission).
   * @throws TransportError when the producer was not reached.
   */
  abstract queue(request: ClientRequest): Promise<void>;
}

/**
 * Stackra file contract:
 * Purpose: `FiscalTransportFake`, a `FiscalTransport` that answers queued responses in order and records every
 *          request.
 * Boundary: built on `Fake` of @stackra/testing. With the queue empty it throws, as a binding does when nothing comes
 *           back, so a test sees an unexpected call.
 * Runtime: isomorphic
 * Governing contract: ADR 0269; ADR 0266 (decision 2); ADR 0364.
 */
import { Fake } from "@stackra/testing";

import { FiscalTransport } from "#contracts/ports/fiscal-transport.port";
import type { TransportRequest } from "#contracts/types/transport-request.type";
import type { TransportResponse } from "#contracts/types/transport-response.type";

/**
 * Answers from a queue.
 *
 * @example
 * const transport = FiscalTransportFake.answering({ status: 200, headers: {}, body: "{}" });
 */
export class FiscalTransportFake extends Fake.of(FiscalTransport) {
  /** Responses still to give. */
  private readonly queue: TransportResponse[];

  /** @param queue - responses to give, in order. */
  constructor(queue: TransportResponse[]) {
    super();
    this.queue = queue;
  }

  /** Shorthand for a fake with these responses. */
  static answering(...responses: TransportResponse[]): FiscalTransportFake {
    return new FiscalTransportFake(responses);
  }

  /** Recorded, then the next queued response; throws when none is left. */
  async send(request: TransportRequest): Promise<TransportResponse> {
    this.record("send", request);
    const next = this.queue.shift();
    if (!next)
      throw new Error(
        `FiscalTransportFake: no response queued for ${request.method} ${request.url}`,
      );
    return next;
  }
}

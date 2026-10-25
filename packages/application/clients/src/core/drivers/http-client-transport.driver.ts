/**
 * Stackra file contract:
 * Purpose: `HttpClientTransportDriver`, the `http` driver of `ClientTransport`: sends a client's calls to the API over
 *          `fetch` with the session's headers, the pinned `Stackra-Version`, an Idempotency-Key on every write, a
 *          per-request timeout and retries of what is safe to repeat.
 * Boundary: the driver of apps and Workers; a service reaches another service through the in-process or RPC driver gen
 *           writes per topology. The session's headers are asked once per call, so a refreshed credential is used at
 *           once. Middleware order: version, idempotency key (outside retry, so every attempt has the same key),
 *           retry, timeout.
 * Runtime: isomorphic
 * Governing contract: ADR 0142 (transport through drivers); ADR 0260 (decision 6); ADR 0138; ADR 0118; ADR 0140.
 */
import { Driver } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import {
  createTransport,
  idempotencyKey,
  retry,
  stackraVersion,
  timeout,
} from "@stackra/transport";
import type { Middleware, Transport } from "@stackra/transport";

import { ClientsConfig } from "#config/clients.config";
import { ClientSession } from "#contracts/ports/client-session.port";
import { ClientTransport } from "#contracts/ports/client-transport.port";
import type { ClientRequest } from "#contracts/types/client-request.type";
import { httpCall } from "#core/functions/http-call.function";

/** Sends calls over HTTP. */
export class HttpClientTransportDriver extends Driver(ClientTransport) {
  private readonly config: ClientsConfig;

  private readonly session: ClientSession;

  private readonly transport: Transport;

  /**
   * @param config - the base URL, the API version, the timeout and the attempts.
   * @param session - the headers of the caller's session.
   */
  constructor(config: ClientsConfig, session: ClientSession) {
    super();
    this.config = config;
    this.session = session;
    const middleware: Middleware[] = [
      idempotencyKey(),
      retry({ attempts: config.attempts }),
      timeout(Duration.seconds(config.timeoutSeconds)),
    ];
    if (config.apiVersion !== "") middleware.unshift(stackraVersion(config.apiVersion));
    this.transport = createTransport({ middleware });
  }

  /**
   * Makes the call and resolves its decoded answer.
   *
   * @throws ClientError the producer's refusal, or a `TransportError`.
   */
  async send(request: ClientRequest): Promise<unknown> {
    return httpCall(request, {
      baseUrl: this.config.baseUrl,
      transport: this.transport,
      headers: await this.session.headers(),
    });
  }

  /**
   * Hands the call to the producer's queue.
   *
   * @throws ClientError when the producer refuses to queue it, or a `TransportError`.
   */
  async queue(request: ClientRequest): Promise<void> {
    await httpCall(request, {
      baseUrl: this.config.baseUrl,
      transport: this.transport,
      headers: await this.session.headers(),
      queue: true,
    });
  }
}

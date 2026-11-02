/**
 * Stackra file contract:
 * Purpose: `FetchDeliveryTransportDriver`, the `DeliveryTransport`: one `fetch` POST of the signed JSON body, no
 *          redirect followed, aborted after the timeout; the answer's status.
 * Boundary: the answer's body is discarded unread, so nothing a consumer returns is logged or stored. A redirect is an
 *           answer the relay counts as a failure. A network error or the timeout rejects.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decision 12); ADR 0142.
 */
import { Driver } from "@stackra/container";

import { DeliveryTransport } from "#contracts/index";

/**
 * Posts deliveries with `fetch`.
 *
 * @example
 * // generated wiring: { port: DeliveryTransport, candidates: { fetch: FetchDeliveryTransportDriver } }
 */
export class FetchDeliveryTransportDriver extends Driver(DeliveryTransport) {
  /** Implements `DeliveryTransport.post`, documented there. */
  async post(
    url: string,
    headers: Readonly<Record<string, string>>,
    body: string,
    timeoutMs: number,
  ): Promise<number> {
    const response = await fetch(url, {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body,
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });
    await response.body?.cancel();
    return response.status;
  }
}

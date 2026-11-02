/**
 * Stackra file contract:
 * Purpose: the `DeliveryTransport` port: how the cross-app relay sends one signed delivery to a subscriber's inbox and
 *          learns the answer's status.
 * Boundary: an abstract class that is its own token, keyed `outbox.DeliveryTransport`. One request, no redirect
 *           followed, given up after `timeoutMs`; a network failure or a timeout rejects. Retries are the relay's. A
 *           leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decision 12); ADR 0142; ADR 0294 (decisions 4, 15 and 16).
 */
import { Port } from "@stackra/contracts";

/**
 * Sends cross-app deliveries.
 *
 * @example
 * export class FetchDeliveryTransportDriver extends Driver(DeliveryTransport) {
 *   async post(url: string, headers: Readonly<Record<string, string>>, body: string, timeoutMs: number): Promise<number> { ... }
 * }
 */
export abstract class DeliveryTransport extends Port {
  /** Type-only port key, so `DriverName<DeliveryTransport>` narrows to this port's drivers. */
  declare readonly "~key": "outbox.DeliveryTransport";

  /** Posts `body` with `headers` to `url`; the answer's status. */
  abstract post(
    url: string,
    headers: Readonly<Record<string, string>>,
    body: string,
    timeoutMs: number,
  ): Promise<number>;
}

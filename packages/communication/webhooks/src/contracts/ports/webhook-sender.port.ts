/**
 * Stackra file contract:
 * Purpose: the `WebhookSender` port: how one signed outbound delivery reaches an endpoint. The `http` driver posts it
 *          with `fetch`; a high-volume driver (Convoy, ADR 0224 decision 3) would implement the same port.
 * Boundary: an abstract class that is its own token. A driver posts once and reports the status; it never retries,
 *           signs, follows a redirect or reads a secret: the delivery job does the retries and the signing.
 * Runtime: isomorphic
 * Governing contract: ADR 0224 (decision 3: the native driver is the default); ADR 0142 (transport behind drivers).
 */
import { Port } from "@stackra/contracts";

import type { WebhookRequest } from "#contracts/types/webhook-request.type";

/**
 * Posts one delivery.
 *
 * @example
 * export class ConvoyWebhookSenderDriver extends Driver(WebhookSender) {
 *   async send(request: WebhookRequest): Promise<number> { ... }
 * }
 */
export abstract class WebhookSender extends Port {
  /** Type-only port key, so `DriverName<WebhookSender>` narrows to this port's drivers. */
  declare readonly "~key": "webhooks.WebhookSender";

  /**
   * Posts `request` once.
   *
   * @returns the endpoint's HTTP status.
   * @throws when the endpoint does not answer (network failure, timeout, abort).
   */
  abstract send(request: WebhookRequest): Promise<number>;
}

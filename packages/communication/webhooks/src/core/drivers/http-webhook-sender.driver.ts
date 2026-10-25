/**
 * Stackra file contract:
 * Purpose: the `http` `WebhookSender`, the native default (ADR 0224 decision 3): one `POST` with `fetch`, the signed
 *          headers and the exact body, answering the endpoint's status.
 * Boundary: posts once; never retries, never follows a redirect (a 3xx is the endpoint's answer and fails the attempt,
 *           so a receiver cannot bounce a signed delivery elsewhere) and never reads the response body. An attempt
 *           that the job's signal or the fifteen-second cap aborts, or that the network fails, rejects.
 * Runtime: isomorphic
 * Governing contract: ADR 0224 (decision 3); ADR 0142 (transport behind drivers); the Standard Webhooks specification.
 */
import { Driver } from "@stackra/container";

import { WebhookSender } from "#contracts/index";
import type { WebhookRequest } from "#contracts/index";

/** How long one endpoint may take to answer. */
const RESPONSE_TIMEOUT_MS = 15_000;

/**
 * Posts deliveries with `fetch`.
 *
 * @example
 * const status = await new HttpWebhookSenderDriver().send({ url, headers, body, signal });
 */
export class HttpWebhookSenderDriver extends Driver(WebhookSender) {
  /** Posts `request` and answers its status; rejects when the endpoint does not answer in time. */
  async send(request: WebhookRequest): Promise<number> {
    const timeout = AbortSignal.timeout(RESPONSE_TIMEOUT_MS);
    const response = await fetch(request.url, {
      method: "POST",
      headers: request.headers,
      body: request.body,
      redirect: "manual",
      signal: request.signal === undefined ? timeout : AbortSignal.any([request.signal, timeout]),
    });
    await response.body?.cancel();
    return response.status;
  }
}

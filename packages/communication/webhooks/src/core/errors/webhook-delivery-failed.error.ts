/**
 * Stackra file contract:
 * Purpose: `WebhookDeliveryFailedError` (`webhook_delivery_failed`), the refusal of one delivery attempt that the
 *          endpoint did not answer with a 2xx: the queue retries it with backoff for about three days.
 * Boundary: kind `Unavailable`, retryable. Its only detail is the endpoint's status (`null` when it did not answer);
 *           nothing of the body, the headers or the secret travels with it.
 * Runtime: isomorphic
 * Governing contract: ADR 0224 (decision 3: at-least-once, retried for about three days); ADR 0140 (envelope and
 *                     kinds); ADR 0328 (`create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The endpoint did not accept the delivery; the job retries it. */
export class WebhookDeliveryFailedError extends Refusal({
  kind: ErrorKind.Unavailable,
  retryable: true,
}) {
  /** The endpoint's HTTP status, or `null` when it did not answer. */
  status!: number | null;
}

/**
 * Stackra file contract:
 * Purpose: the `WebhookDeliveryLog` port: where the delivery job records each attempt, so a service with its own
 *          delivery tables keeps its log while reusing `DeliverWebhookAction`.
 * Boundary: an abstract class that is its own token, keyed `webhooks.WebhookDeliveryLog`. This package's `model`
 *           driver (`./node`) writes `webhooks.webhook_deliveries` through `WebhookDeliveryService`; a host binds its
 *           own with `@Replaces`. A driver writes in a transaction of its own, so a failed attempt stays logged when
 *           the job's unit of work rolls back to be retried.
 * Runtime: isomorphic
 * Governing contract: ADR 0224 (decision 3); ADR 0142 (behaviour behind drivers); ADR 0306 (rule 9).
 */
import { Port } from "@stackra/contracts";

import type { WebhookAttempt } from "#contracts/types/webhook-attempt.type";

/**
 * Records delivery attempts.
 *
 * @example
 * export class AttemptWebhookDeliveryLogDriver extends Driver(WebhookDeliveryLog) {
 *   async record(attempt: WebhookAttempt): Promise<void> { ... }
 * }
 */
export abstract class WebhookDeliveryLog extends Port {
  /** Type-only port key, so `DriverName<WebhookDeliveryLog>` narrows to this port's drivers. */
  declare readonly "~key": "webhooks.WebhookDeliveryLog";

  /**
   * Stores `attempt` in a transaction of its own.
   *
   * @throws Error when it cannot be stored; the attempt then fails and is retried.
   */
  abstract record(attempt: WebhookAttempt): Promise<void>;
}

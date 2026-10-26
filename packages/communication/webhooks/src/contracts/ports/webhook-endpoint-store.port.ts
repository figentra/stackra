/**
 * Stackra file contract:
 * Purpose: the `WebhookEndpointStore` port: where the outbound delivery machinery (`SendWebhooksListener`,
 *          `DeliverWebhookAction`) finds its receivers, so a service that keeps its own endpoint tables (OS webhooks'
 *          `Endpoint`, registry's partner lead targets) reuses the fan-out, the signed job, its retries and the
 *          dead-letter disable without this package's `webhooks.webhook_endpoints` table.
 * Boundary: an abstract class that is its own token, keyed `webhooks.WebhookEndpointStore`. This package's `model`
 *           driver (`./node`) answers from `WebhookEndpointService`; a host binds its own with `@Replaces`. A store
 *           answers enabled receivers only, applies its own subscription rules (the entitlement gate of this package's
 *           driver), and resolves secret values only in `target`, at the attempt.
 * Runtime: isomorphic
 * Governing contract: ADR 0224 (decisions 1 to 3); ADR 0142 (behaviour behind drivers); ADR 0306 (rule 9: a behaviour
 *                     swap is a driver); ADR 0422 (decision 4).
 */
import { Port } from "@stackra/contracts";

import type { WebhookDeliveryTarget } from "#contracts/types/webhook-delivery-target.type";
import type { WebhookTarget } from "#contracts/types/webhook-target.type";

/**
 * Finds, signs for and disables receivers.
 *
 * @example
 * export class EndpointWebhookEndpointStoreDriver extends Driver(WebhookEndpointStore) {
 *   async subscribedTo(scopeId: string, type: string): Promise<readonly WebhookTarget[]> { ... }
 *   async target(id: string, now: Date): Promise<WebhookDeliveryTarget | null> { ... }
 *   async disable(id: string, at: Date): Promise<void> { ... }
 * }
 */
export abstract class WebhookEndpointStore extends Port {
  /** Type-only port key, so `DriverName<WebhookEndpointStore>` narrows to this port's drivers. */
  declare readonly "~key": "webhooks.WebhookEndpointStore";

  /** The enabled receivers of scope node `scopeId` subscribed to the event wire name `type`. */
  abstract subscribedTo(scopeId: string, type: string): Promise<readonly WebhookTarget[]>;

  /**
   * Receiver `id` with the secrets an attempt at `now` signs with; `null` when it was removed or disabled.
   *
   * @throws Error when a secret it names has no value; the attempt then posts nothing.
   */
  abstract target(id: string, now: Date): Promise<WebhookDeliveryTarget | null>;

  /** Stops delivery to receiver `id` at `at`; one already disabled or removed is left as it is. */
  abstract disable(id: string, at: Date): Promise<void>;
}

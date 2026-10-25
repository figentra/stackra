/**
 * Stackra file contract:
 * Purpose: `ConnectionWebhooks`, the two optional methods a connection class may add to manage its webhooks at the
 *          provider: `subscribe(webhookUrl)` at connect and `unsubscribe()` at disconnect.
 * Boundary: a type only. The `Connection` base does not declare them, so a class that has them needs no `override` and
 *           one without them is complete; `implements ConnectionWebhooks` lets the compiler check their signatures.
 *           A store calls each only when the connection has it.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 2, 17 and 18).
 */
import type { ConnectionSubscription } from "#core/types/connection-subscription.type";

/**
 * The webhook methods of a connection.
 *
 * @example
 * export class CalComConnection extends Connection<CalComIntegration> implements ConnectionWebhooks {
 *   async subscribe(webhookUrl: string): Promise<ConnectionSubscription> { ... }
 *   async unsubscribe(): Promise<void> { ... }
 * }
 */
export interface ConnectionWebhooks {
  /** Subscribes `webhookUrl` at the provider; a signing secret it returns is kept in the webhook secret field. */
  subscribe?(webhookUrl: string): Promise<ConnectionSubscription>;

  /** Removes the connection's webhook subscription at the provider. */
  unsubscribe?(): Promise<void>;
}

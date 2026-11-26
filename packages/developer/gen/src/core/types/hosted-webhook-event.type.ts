/**
 * Stackra file contract:
 * Purpose: `HostedWebhookEvent`, one `WebhookEvent<I>` a hosted package's manifest lists (`webhookEvents`), paired with
 *          the Integration and the Connection that manifest lists for it, as a host registers it.
 * Boundary: a type only; built by `hostedWebhookEvents` from the committed manifests, never from a package's source.
 *           Every class is imported from the public entry the manifest names.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 15 and 16); ADR 0294 (decision 22: a dependency is read from its manifest).
 */
import type { ClassRef } from "#core/types/class-ref.type";

/** A hosted package's webhook event with its pairing. */
export interface HostedWebhookEvent {
  /** The package whose manifest lists it (`@acme/ship-courier`). */
  readonly package: string;

  /** The event class and its public entry. */
  readonly event: ClassRef;

  /** The provider's event type (`shipment.updated`), when the manifest records it. */
  readonly type?: string;

  /** The Integration that verifies it, as the same manifest lists it. */
  readonly integration: ClassRef;

  /** The Integration's Connection, absent for a platform-only Integration. */
  readonly connection?: ClassRef;
}

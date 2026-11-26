/**
 * Stackra file contract:
 * Purpose: `EventsRelayOptions`, the shape of `EventsRelayConfig`: the signing key's secret name, the public keys
 *          (current first) and the subscribers in other apps.
 * Boundary: a schema class registered with the shipped `EVENTS_RELAY_CONFIG_SCHEMA`; the initializers equal its
 *           defaults. Gen emits the value from the producer's `runway.yaml` `events` block of each environment.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 16 and 17, amendment of 2026-11-02); ADR 0294 (decisions 19 and 26).
 */
import { Field, registerSchemas, Schema } from "@stackra/validation";

import type { RelayKey, Subscriber } from "#contracts/index";
import { EVENTS_RELAY_CONFIG_SCHEMA } from "#core/constants/events-relay-config-schema.constant";

/**
 * The cross-app relay options of one environment.
 *
 * @example
 * export class EventsRelayConfig extends Config({ schema: EventsRelayOptions }) {}
 */
export class EventsRelayOptions extends Schema {
  /** The public keys, current first; the current one signs. */
  // reason: a list of inline keys runway sets whole; the shipped schema already says its rule
  @Field(EVENTS_RELAY_CONFIG_SCHEMA.shape.keys)
  keys: RelayKey[] = [];

  /** The consumers in other apps and the versioned events each takes. */
  // reason: a list of inline subscribers runway sets whole; the shipped schema already says its rule
  @Field(EVENTS_RELAY_CONFIG_SCHEMA.shape.subscribers)
  subscribers: Subscriber[] = [];

  /** The secret name of the Ed25519 private key; its value is the secret store's. */
  signingKey = "STACKRA_EVENTS_SIGNING_KEY";
}

registerSchemas([[EventsRelayOptions, EVENTS_RELAY_CONFIG_SCHEMA]]);

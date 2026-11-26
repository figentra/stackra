/**
 * Stackra file contract:
 * Purpose: `EventsRelayConfig`, a producer's cross-app relay configuration (key `outbox.events_relay`): the secret name
 *          of its Ed25519 signing key (`STACKRA_EVENTS_SIGNING_KEY` by default), its public keys, current first, and
 *          its subscribers in other apps, each with its inbox origin and the versioned events it takes.
 * Boundary: a configuration class over `EventsRelayOptions` with no env map: gen emits the value from the producer's
 *           `runway.yaml` `events` block at build time, never from runtime env vars. Empty by default, so a service
 *           with no `events` block publishes nothing across apps. The key's value is never here (ADR 0173).
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 16 and 17, amendment of 2026-11-02); ADR 0294 (decisions 19 and 20);
 *                     ADR 0146 as amended; ADR 0173.
 */
import { Config } from "@stackra/config";

import { EventsRelayOptions } from "#core/schemas/events-relay-options.schema";

/**
 * The cross-app relay configuration.
 *
 * @example
 * buildConfig(EventsRelayConfig, { values: { keys: [{ id: "pay-dev-1", publicKey }], subscribers } });
 */
export class EventsRelayConfig extends Config({ schema: EventsRelayOptions }) {}

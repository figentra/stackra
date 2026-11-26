/**
 * Stackra file contract:
 * Purpose: `ConfigSubscriberSourceDriver`, the first `SubscriberSource`: the subscribers of the producer's `events` block of
 *          the running environment, as runway's `runway.yaml` lists them.
 * Boundary: reads the injected `EventsRelayConfig` (key `outbox.events_relay`), whose value gen emits from
 *           `runway.yaml` at build time (it is not read from runtime env vars). Pure lookup, no I/O.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decision 17, amendment of 2026-11-02); ADR 0142 (drivers behind ports).
 */
import { Driver } from "@stackra/container";

import type { EventsRelayConfig } from "#config/events-relay.config";
import { SubscriberSource } from "#contracts/index";
import type { Subscriber } from "#contracts/index";

/**
 * Reads subscribers from the relay configuration.
 *
 * @example
 * const source = new ConfigSubscriberSourceDriver(buildConfig(EventsRelayConfig, { values: { subscribers } }));
 */
export class ConfigSubscriberSourceDriver extends Driver(SubscriberSource) {
  /** The running environment's relay configuration. */
  private readonly config: EventsRelayConfig;

  /**
   * @param config - the producer's `events` block of this environment.
   */
  constructor(config: EventsRelayConfig) {
    super();
    this.config = config;
  }

  /** Implements `SubscriberSource.subscribersOf`, documented there. */
  subscribersOf(type: string): Promise<readonly Subscriber[]> {
    return Promise.resolve(
      this.config.subscribers.filter((subscriber) => subscriber.events.includes(type)),
    );
  }
}

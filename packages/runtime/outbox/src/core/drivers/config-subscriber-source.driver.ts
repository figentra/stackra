/**
 * Stackra file contract:
 * Purpose: `ConfigSubscriberSourceDriver`, the first `SubscriberSource`: the subscribers runway sets for this
 *          environment in `CrossAppConfig.subscribers`, from the producer's `events` block.
 * Boundary: reads the frozen configuration only; a change takes a restart. The Control Plane's source later replaces
 *           this driver, not the port (ADR 0511 decision 17).
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 12 and 17, amendment of 2026-11-02); ADR 0296 (decision 1).
 */
import { Driver } from "@stackra/container";

import type { CrossAppConfig } from "#config/cross-app.config";
import { SubscriberSource } from "#contracts/index";
import type { Subscriber } from "#contracts/index";

/**
 * Lists the subscribers runway configured.
 *
 * @example
 * // generated wiring: { port: SubscriberSource, candidates: { config: ConfigSubscriberSourceDriver } }
 */
export class ConfigSubscriberSourceDriver extends Driver(SubscriberSource) {
  /** The configured subscribers. */
  private readonly config: CrossAppConfig;

  /**
   * @param config - the subscribers of this environment.
   */
  constructor(config: CrossAppConfig) {
    super();
    this.config = config;
  }

  /** Implements `SubscriberSource.subscribersOf`, documented there. */
  subscribersOf(type: string): readonly Subscriber[] {
    return this.config.subscribers.filter((subscriber) => subscriber.events.includes(type));
  }

  /** Implements `SubscriberSource.subscriber`, documented there. */
  subscriber(member: string): Subscriber | undefined {
    return this.config.subscribers.find((subscriber) => subscriber.member === member);
  }
}

/**
 * Stackra file contract:
 * Purpose: `RelayInboxOptions`, the shape of `RelayInboxConfig`: the running environment and the pinned producers'
 *          public keys per environment and published events.
 * Boundary: a schema class registered with the shipped `RELAY_INBOX_CONFIG_SCHEMA`; the initializers equal its
 *           defaults. Gen emits `producers` from the pinned contracts' manifests.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 16 and 18, amendment of 2026-11-02); ADR 0294 (decisions 19 and 26).
 */
import { Field, registerSchemas, Schema } from "@stackra/validation";

import type { PinnedProducer } from "#contracts/index";
import { RELAY_INBOX_CONFIG_SCHEMA } from "#core/constants/relay-inbox-config-schema.constant";

/**
 * The consumer inbox options.
 *
 * @example
 * export class RelayInboxConfig extends Config({ schema: RelayInboxOptions }) {}
 */
export class RelayInboxOptions extends Schema {
  /** Producer service to its public keys per environment and the events it publishes. */
  // reason: a nested record of inline keys and events gen sets whole; the shipped schema already says its rule
  @Field(RELAY_INBOX_CONFIG_SCHEMA.shape.producers)
  producers: Record<string, PinnedProducer> = {};

  /** The running environment, whose listed keys the inbox accepts (`STACKRA_ENVIRONMENT`). */
  environment = "dev";
}

registerSchemas([[RelayInboxOptions, RELAY_INBOX_CONFIG_SCHEMA]]);

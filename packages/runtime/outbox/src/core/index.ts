/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/outbox (the configuration with its shape and shipped schema, the
 *          memory drivers of the three stores, the `EventOutbox` driver, the wire-name and change-consumer
 *          registrations, the `@ConsumesChanges` facet, change coalescing, the outbox prune `pruneOutbox`, and the
 *          unknown-event refusal) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The shipped schema is re-exported under its generated name
 *           (`OutboxConfig$`). The registries, defaults, id minting and message building stay internal. The ports are
 *           `./contracts`'; the flush writer, the relay, the inbox and the Postgres drivers are `./node`'s. Nothing
 *           here touches a database.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { CrossAppConfig } from "#config/cross-app.config";
export { OutboxConfig } from "#config/outbox.config";
export { CROSS_APP_CONFIG_SCHEMA as CrossAppConfig$ } from "#core/constants/cross-app-config-schema.constant";
export { OUTBOX_CONFIG_SCHEMA as OutboxConfig$ } from "#core/constants/outbox-config-schema.constant";
export { ConsumesChanges } from "#core/decorators/consumes-changes.decorator";
export { BrokerEventPublisherDriver } from "#core/drivers/broker-event-publisher.driver";
export { ConfigSubscriberSourceDriver } from "#core/drivers/config-subscriber-source.driver";
export { ContractInboxVerifierDriver } from "#core/drivers/contract-inbox-verifier.driver";
export { Ed25519EventSignerDriver } from "#core/drivers/ed25519-event-signer.driver";
export { FetchDeliveryTransportDriver } from "#core/drivers/fetch-delivery-transport.driver";
export { MemoryChangeFeedDriver } from "#core/drivers/memory-change-feed.driver";
export { MemoryDeliveryDriver } from "#core/drivers/memory-delivery.driver";
export { MemoryInboxDriver } from "#core/drivers/memory-inbox.driver";
export { MemoryOutboxDriver } from "#core/drivers/memory-outbox.driver";
export { OutboxEventOutboxDriver } from "#core/drivers/outbox-event-outbox.driver";
export { CrossAppKeyMissingError } from "#core/errors/cross-app-key-missing.error";
export { UnknownEventError } from "#core/errors/unknown-event.error";
export { coalesceChanges } from "#core/functions/coalesce-changes.function";
export { pruneOutbox } from "#core/functions/prune-outbox.function";
export { redactSubjectMessages } from "#core/functions/redact-subject-messages.function";
export { registerChangeConsumers } from "#core/functions/register-change-consumers.function";
export { registerEventNames } from "#core/functions/register-event-names.function";
export { registerProducerKeys } from "#core/functions/register-producer-keys.function";
export { registerRelays } from "#core/functions/register-relays.function";
export { CrossAppOptions } from "#core/schemas/cross-app-options.schema";
export { OutboxOptions } from "#core/schemas/outbox-options.schema";

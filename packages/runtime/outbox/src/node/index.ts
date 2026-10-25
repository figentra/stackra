/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/outbox (the flush writer, the relay, the inbox, the
 *          in-process publisher and the Postgres drivers of both stores) until `stackra gen` writes the entry barrels
 *          (STA-339).
 * Boundary: names each re-export and declares nothing. Server only: everything here reaches Postgres through
 *           @stackra/database or opens its scope sessions. The two migrations are found by their paths, as every
 *           migration is, so they are not re-exported; the ORM argument types and the insert statement stay internal.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note (an entry exists once its folder has a file);
 *                     the STA-347 stand-in barrel decision.
 */
export { InboxEventPublisherDriver } from "#node/drivers/inbox-event-publisher.driver";
export { PostgresInboxDriver } from "#node/drivers/postgres-inbox.driver";
export { PostgresOutboxDriver } from "#node/drivers/postgres-outbox.driver";
export { InboxService } from "#node/services/inbox.service";
export { OutboxRelayService } from "#node/services/outbox-relay.service";
export { OutboxWriterService } from "#node/services/outbox-writer.service";

/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/outbox (the `OutboxDriver`, `InboxDriver` and
 *          `EventPublisher` ports, the `MessageKind` and `RowChangeKind` enums, and the stored message, envelope, row
 *          change and change consumer types) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package
 *           (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { MessageKind } from "#contracts/enums/message-kind.enum";
export { RowChangeKind } from "#contracts/enums/row-change-kind.enum";
export { EventPublisher } from "#contracts/ports/event-publisher.port";
export { InboxDriver } from "#contracts/ports/inbox-driver.port";
export { OutboxDriver } from "#contracts/ports/outbox-driver.port";
export type { ChangeConsumer } from "#contracts/types/change-consumer.type";
export type { EventEnvelope } from "#contracts/types/event-envelope.type";
export type { OutboxError } from "#contracts/types/outbox-error.type";
export type { OutboxMessage } from "#contracts/types/outbox-message.type";
export type { RowChange } from "#contracts/types/row-change.type";

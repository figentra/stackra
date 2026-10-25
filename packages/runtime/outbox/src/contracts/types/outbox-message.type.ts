/**
 * Stackra file contract:
 * Purpose: `OutboxMessage`, one stored message as an `OutboxDriver` keeps it: an integration event under its wire name
 *          or a watched row change, its payload and metadata, the scope of the transaction that wrote it, and its
 *          delivery state (attempts, when it is next due, its last failure, when it was dead-lettered).
 * Boundary: a type only. The payload is JSON (an event's fields, or a `RowChange`), never a class instance. The scope
 *           is not chosen by the writer: the Postgres store takes the transaction's scope settings, the ones row-level
 *           security reads, so a message is delivered in the scope its change was made in. The metadata is
 *           @stackra/events' `EventMeta` without the id and time, which the message holds itself.
 * Runtime: isomorphic
 * Governing contract: ADR 0078 (decision 4); ADR 0141 (decisions 2 and 3: the envelope and the one-to-one mapping);
 *                     ADR 0327 and ADR 0323 (a scope is a `ScopeRef`).
 */
import type { PublicId, ScopeRef } from "@stackra/contracts";
import type { EventMeta } from "@stackra/events/contracts";

import type { MessageKind } from "#contracts/enums/message-kind.enum";
import type { OutboxError } from "#contracts/types/outbox-error.type";

/** A stored outbox message. */
export interface OutboxMessage {
  /** The message id, which is the event id of an event (`evt_…`); ids minted here grow with time. */
  readonly id: PublicId<"evt">;

  /** An event or a row change. */
  readonly kind: MessageKind;

  /** The event's wire name (`orders.order.paid.v1`), or the changed model's class name (`Product`). */
  readonly type: string;

  /** The event's fields, or the `RowChange`, as JSON. */
  readonly data: unknown;

  /** Who caused it and the ids that chain it to its call and cause. */
  readonly meta: Omit<EventMeta, "id" | "occurredAt">;

  /** When the fact happened. */
  readonly occurredAt: Date;

  /** The scope of the transaction that wrote it; absent for a platform write. */
  readonly scope?: ScopeRef;

  /** Deliveries tried so far. */
  readonly attempts: number;

  /** When it is next due. */
  readonly availableAt: Date;

  /** How its last delivery failed. */
  readonly lastError?: OutboxError;

  /** When it was dead-lettered after its last attempt; the relay skips it from then on. */
  readonly deadAt?: Date;
}

/**
 * Stackra file contract:
 * Purpose: `StateTransitioned`, the history entry of one transition: a domain event a machine records on the record
 *          after the body's own events, which the audit log's listener persists.
 * Boundary: a domain event, so it is dispatched in process after commit and never written to the outbox; a rolled-back
 *           transition leaves no history. It registers this package's own schema when the module loads, so
 *           `StateTransitioned.create` works with no generated file. Not recorded by a machine with `history: false`.
 * Runtime: isomorphic
 * Governing contract: ADR 0161 (decision 4 and the 0294 note); ADR 0305 (rules 19 and 21); ADR 0294 (decision 27).
 */
import { DomainEvent } from "@stackra/events";
import { registerSchemas } from "@stackra/validation";

import { STATE_TRANSITIONED_SCHEMA } from "#core/constants/state-transitioned-schema.constant";

/**
 * One transition of one record.
 *
 * @example
 * export class StateHistoryListener extends Listener {
 *   async handle(event: StateTransitioned): Promise<void> {
 *     await this.audit.write({ subject: event.recordId, change: `${event.field}: ${event.from} → ${event.to}` });
 *   }
 * }
 */
export class StateTransitioned extends DomainEvent {
  /** The machine class (`OrderStateMachine`). */
  machine!: string;

  /** The transition method (`cancel`). */
  transition!: string;

  /** The governed field (`status`). */
  field!: string;

  /** The state before. */
  from!: string;

  /** The state after. */
  to!: string;

  /** The record's `id`, when the model has a string id (`HasPublicId`). */
  recordId?: string;
}

registerSchemas([[StateTransitioned, STATE_TRANSITIONED_SCHEMA]]);

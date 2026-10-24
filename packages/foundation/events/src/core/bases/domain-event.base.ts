/**
 * Stackra file contract:
 * Purpose: `DomainEvent`, the kind base of a fact that stays inside one service: recorded on an aggregate and
 *          dispatched in process after commit, never written to the outbox, never versioned, never broadcast, never a
 *          webhook.
 * Boundary: a bare-only kind base, registered as `domain_event`: it takes no options, so it has no called form and
 *           no name (gen derives the in-service key from the class). It reaches another service only through a
 *           listener that records an integration event (ADR 0305 rule 21).
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 19 and 21); ADR 0294 (decisions 16 and 20; amendment item 5: a kind without
 *                     options is written bare); ADR 0141 (2026-10-23 note); ADR 0078 (decision 3).
 */
import { registerKind } from "@stackra/container";

import { Event } from "#core/bases/event.base";

/**
 * The domain event kind base.
 *
 * @example
 * export class PointsRedeemed extends DomainEvent {
 *   memberId!: string;
 *
 *   @Int
 *   points!: number;
 * }
 */
export abstract class DomainEvent extends Event {
  /** Type-only kind brand. */
  declare protected readonly "~kind": "domain_event";
}

registerKind(DomainEvent, "domain_event");

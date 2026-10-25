/**
 * Stackra file contract:
 * Purpose: `EventMeta`, what travels beside an event's fields: its id, when it happened and who caused it. The event
 *          instance holds its payload only (ADR 0294 decision 27); the metadata is kept here, so the outbox can map
 *          it one to one onto the ADR 0141 envelope (`id`, `occurredAt`, `tenant`, `actor`, `correlation`,
 *          `causation`).
 * Boundary: a type only, in the leaf entry: it imports nothing from another entry of this package. The wire name,
 *           version and `data` of the envelope are the outbox's, from the committed manifest.
 * Runtime: isomorphic
 * Governing contract: ADR 0141 (decision 2: the envelope fields); ADR 0294 (decisions 15 and 27); ADR 0308 (rule 16).
 */
import type { Actor } from "@stackra/contracts";

/** The metadata of one occurrence of an event. */
export interface EventMeta {
  /** The event id, unique per occurrence; consumers process each id once (inbox dedup). */
  readonly id: string;

  /** When the fact happened. */
  readonly occurredAt: Date;

  /** The tenant the fact belongs to; absent for a platform event. */
  readonly tenantId?: string;

  /** Who caused it, with the delegation chain behind them. */
  readonly actor?: Actor;

  /** The id shared by every event and call of one unit of work. */
  readonly correlationId?: string;

  /** The id of the event that caused this one. */
  readonly causationId?: string;

  /** The connection a webhook event arrived on; absent for an event of the platform's own account (ADR 0308). */
  readonly connection?: string;
}

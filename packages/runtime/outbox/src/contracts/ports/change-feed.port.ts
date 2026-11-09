/**
 * Stackra file contract:
 * Purpose: the `ChangeFeed` port: the retained change log behind the relay's change delivery. It appends the row
 *          changes of a producer's transaction, claims committed ones in a stable order after a position and loads them
 *          per tenant, keeps one cursor per change consumer, and drops what retention no longer keeps. Config
 *          `outbox.driver` picks the driver (`postgres`, `memory`).
 * Boundary: an abstract class that is its own token, keyed `outbox.ChangeFeed`. A driver stores and lists; it never
 *           delivers or reads a clock. `append` joins the caller's transaction. A claim (`claim`, `expired`) and
 *           `positionAt` read across tenants and hand back positions and the owning tenant only; `load` and `remove`
 *           run in the caller's isolation, so a tenant's entries are read or deleted only in its own (ADR 0239
 *           amendment, gaps A and C). `claim` lists only entries no running transaction can still precede, so a cursor
 *           never skips a change that commits late. Entries are kept after delivery (no delete-on-deliver), so a new or
 *           replayed consumer reads the retained window.
 * Runtime: isomorphic
 * Governing contract: ADR 0078 and ADR 0221 (2026-10-28 amendment: the outbox change feed; Debezium and WAL readers
 *                     stay rejected, ADR 0227); ADR 0239 (2026-11-07 amendment, gaps A and C); ADR 0142 (drivers behind ports); ADR 0263 (ports resolve by type).
 */
import { Port } from "@stackra/contracts";
import type { Duration } from "@stackra/contracts";

import type { ChangeClaim } from "#contracts/types/change-claim.type";
import type { ChangeCursor } from "#contracts/types/change-cursor.type";
import type { ChangeLogReport } from "#contracts/types/change-log-report.type";
import type { ChangeRecord } from "#contracts/types/change-record.type";

/**
 * A retained change log.
 *
 * @example
 * export class ValkeyChangeFeedDriver extends Driver(ChangeFeed) { ... }
 */
export abstract class ChangeFeed extends Port {
  /** Type-only port key, so `DriverName<ChangeFeed>` narrows to this port's drivers. */
  declare readonly "~key": "outbox.ChangeFeed";

  /** Appends `entries`, in order, inside the caller's transaction (the Postgres driver takes its scope settings). */
  abstract append(entries: readonly Omit<ChangeRecord, "position">[]): Promise<void>;

  /**
   * Claims up to `limit` committed entries of `models` of every tenant after `after` (from the start when undefined),
   * in log order: positions and tenants only.
   */
  abstract claim(
    after: string | undefined,
    models: readonly string[],
    limit: number,
  ): Promise<readonly ChangeClaim[]>;

  /** The entries at `positions` the caller's isolation reads, in log order; a position it may not read is left out. */
  abstract load(positions: readonly string[]): Promise<readonly ChangeRecord[]>;

  /** The position a cursor takes to read every entry written at or after `at`; undefined for the log's start. */
  abstract positionAt(at: Date): Promise<string | undefined>;

  /** The cursor of `consumer`, or undefined before its first delivery. */
  abstract cursor(consumer: string): Promise<ChangeCursor | undefined>;

  /** Stores `cursor`, replacing that consumer's previous one. */
  abstract save(cursor: ChangeCursor): Promise<void>;

  /**
   * Prepares the log for `now` and drops whole what ended more than `retain` before it; entries it cannot drop whole
   * (`expired`) are left to the caller, who deletes them per tenant.
   */
  abstract maintain(now: Date, retain: Duration): Promise<ChangeLogReport>;

  /** Claims up to `limit` entries of every tenant older than `before` that `maintain` leaves, oldest first. */
  abstract expired(before: Date, limit: number): Promise<readonly ChangeClaim[]>;

  /** Deletes the entries at `positions` the caller's isolation may delete. */
  abstract remove(positions: readonly string[]): Promise<void>;
}

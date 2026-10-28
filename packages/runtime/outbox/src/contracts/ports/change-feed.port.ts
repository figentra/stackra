/**
 * Stackra file contract:
 * Purpose: the `ChangeFeed` port: the retained change log behind the relay's change delivery. It appends the row
 *          changes of a producer's transaction, lists committed ones in a stable order after a position, keeps one
 *          cursor per change consumer, and drops what retention no longer keeps. Config `outbox.driver` picks the
 *          driver (`postgres`, `memory`).
 * Boundary: an abstract class that is its own token, keyed `outbox.ChangeFeed`. A driver stores and lists; it never
 *           delivers or reads a clock. `append` joins the caller's transaction. `read` lists only entries no running
 *           transaction can still precede, so a cursor never skips a change that commits late. Entries are kept after
 *           delivery (no delete-on-deliver), so a new or replayed consumer reads the retained window.
 * Runtime: isomorphic
 * Governing contract: ADR 0078 and ADR 0221 (2026-10-28 amendment: the outbox change feed; Debezium and WAL readers
 *                     stay rejected, ADR 0227); ADR 0142 (drivers behind ports); ADR 0263 (ports resolve by type).
 */
import { Port } from "@stackra/contracts";
import type { Duration } from "@stackra/contracts";

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

  /** Up to `limit` committed entries of `models` after `after` (from the start when undefined), in log order. */
  abstract read(
    after: string | undefined,
    models: readonly string[],
    limit: number,
  ): Promise<readonly ChangeRecord[]>;

  /** The position a cursor takes to read every entry written at or after `at`; undefined for the log's start. */
  abstract positionAt(at: Date): Promise<string | undefined>;

  /** The cursor of `consumer`, or undefined before its first delivery. */
  abstract cursor(consumer: string): Promise<ChangeCursor | undefined>;

  /** Stores `cursor`, replacing that consumer's previous one. */
  abstract save(cursor: ChangeCursor): Promise<void>;

  /** Prepares the log for `now` and drops what ended more than `retain` before it. */
  abstract maintain(now: Date, retain: Duration): Promise<ChangeLogReport>;
}

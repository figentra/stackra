/**
 * Stackra file contract:
 * Purpose: `RetentionOptions`, what `Retention({...})` takes: how long a row is kept, the date field its age is read
 *          from, and what happens once it is older: archived, soft-deleted or deleted for good.
 * Boundary: a type only. Read by @stackra/database's `pruneRecords` and the `data_maintenance.record.prune` job
 *           through the trait registry. Values are the model author's configuration, never computed.
 * Runtime: isomorphic
 * Governing contract: ADR 0134 (decision 3: `@Retention` drives the prune jobs; holds suspend a purge); ADR 0189
 *                     (decision 4: retention defaults); data-layer gaps gov4 and mo27.
 */
import type { Duration } from "@stackra/contracts";

/** The retention of a model's rows. */
export interface RetentionOptions {
  /** How long a row is kept after its `basis` date. */
  readonly keep: Duration;

  /** The `Date` field a row's age is read from (`createdAt`, `closedAt`). */
  readonly basis: string;

  /**
   * What an expired row becomes: `archive` sets `archivedAt` (needs `Archivable`), `soft` sets `deletedAt` (needs
   * `SoftDeletes`, then purged 30 days later), `hard` deletes it unless a legal hold covers it.
   */
  readonly policy: "archive" | "soft" | "hard";
}

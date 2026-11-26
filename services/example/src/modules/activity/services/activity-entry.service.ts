/**
 * Stackra file contract:
 * Purpose: `ActivityEntryService`, the reads and writes of `ActivityEntry` rows: the listeners record an entry, the
 *          feed query reads them, and the retention job prunes the old ones.
 * Boundary: runs inside the caller's transaction and tenant isolation (a listener's delivery, a query's call or a job's
 *           run), so the row-level policy applies to every statement: no method takes or filters by a tenant.
 * Runtime: node
 * Governing contract: ADR 0105 as amended by ADR 0294; ADR 0305 (partners); ADR 0239 (isolation in the database).
 */
import type { PublicId } from "@stackra/contracts";
import { CrudService } from "@stackra/database";

import type { ActivityKind } from "#modules/activity/enums/activity-kind.enum";
import type { ActivityEntry } from "#modules/activity/models/activity-entry.model";

/** The activity module's reads and writes. No method takes a tenant. */
export class ActivityEntryService extends CrudService<ActivityEntry> {
  /**
   * Records that `kind` happened to `noteId` at `occurredAt`, for the running call's tenant.
   *
   * @example
   * await entries.record(ActivityKind.NoteCreated, event.noteId, ctx.occurredAt);
   */
  record(kind: ActivityKind, noteId: PublicId<"not">, occurredAt: Date): Promise<ActivityEntry> {
    return this.insert({ kind, noteId, occurredAt });
  }

  /**
   * Deletes the running tenant's entries that happened before `cutoff`; answers how many went.
   *
   * @example
   * const deleted = await entries.prune(new Date("2026-08-01T00:00:00Z"));
   */
  prune(cutoff: Date): Promise<number> {
    return this.deleteWhere({ occurredAt: { $lt: cutoff } });
  }
}

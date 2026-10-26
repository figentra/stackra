/**
 * Stackra file contract:
 * Purpose: `PostgresSettingRevisionStoreDriver`, the server's `SettingRevisionStore`: keeps revisions in
 *          `settings.stored_setting_revisions` through `StoredSettingRevisionService` and hands each row on as a
 *          `SettingRevision` (its public id as the id, times as ISO-8601).
 * Boundary: reads and writes in the caller's transaction; the holder is the target's, never request input.
 * Runtime: node
 * Governing contract: ADR 0213 (decision 5); ADR 0142 (drivers behind a port); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";

import { SettingRevisionStore } from "#contracts/index";
import type { SettingRevision, SettingTarget } from "#contracts/index";
import type { StoredSettingRevision } from "#node/models/stored-setting-revision.model";
import type { StoredSettingRevisionService } from "#node/services/stored-setting-revision.service";

/** The revision of one row. */
function revisionOf(row: StoredSettingRevision): SettingRevision {
  const target: SettingTarget =
    row.userId !== null
      ? { user: row.userId }
      : row.scopeId !== null && row.scopePath !== null
        ? { scope: { id: row.scopeId, path: row.scopePath } }
        : {};
  return {
    id: row.id,
    group: row.groupKey,
    target,
    values: row.values,
    removed: row.removed,
    ...(row.locked === null ? {} : { locked: row.locked }),
    previous: row.previous,
    author: row.author,
    reason: row.reason,
    environment: row.environment,
    breakGlass: row.breakGlass,
    status: row.status,
    effectiveAt: row.effectiveAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    decidedBy: row.decidedBy,
    appliedAt: row.appliedAt === null ? null : row.appliedAt.toISOString(),
  };
}

/**
 * The revision store over the revisions table.
 *
 * @example
 * const resolver = new SettingsResolver(values, floors, revisionStore, clock);
 */
export class PostgresSettingRevisionStoreDriver extends Driver(SettingRevisionStore) {
  /** The table's service. */
  private readonly rows: StoredSettingRevisionService;

  /**
   * @param rows - the table's service.
   */
  constructor(rows: StoredSettingRevisionService) {
    super();
    this.rows = rows;
  }

  /** Stores `revision` and returns it with its new id. */
  async append(revision: Omit<SettingRevision, "id">): Promise<SettingRevision> {
    return revisionOf(await this.rows.append(revision));
  }

  /** The revision `id`, or `null` when there is none. */
  async find(id: string): Promise<SettingRevision | null> {
    const row = await this.rows.findOne({ id: id as StoredSettingRevision["id"] });
    return row === null ? null : revisionOf(row);
  }

  /** The revisions of `group` at exactly `target`'s holder, newest first. */
  async list(group: string, target: SettingTarget): Promise<readonly SettingRevision[]> {
    return (await this.rows.listOf(group, target)).map(revisionOf);
  }

  /** The scheduled revisions due at or before `at`, oldest first. */
  async due(at: string): Promise<readonly SettingRevision[]> {
    return (await this.rows.dueAt(new Date(at))).map(revisionOf);
  }

  /** Moves revision `id` to `patch` and returns it. */
  async update(
    id: string,
    patch: Pick<SettingRevision, "status"> &
      Partial<Pick<SettingRevision, "decidedBy" | "appliedAt">>,
  ): Promise<SettingRevision> {
    const row = await this.rows.findOne({ id: id as StoredSettingRevision["id"] });
    if (row === null) throw new TypeError(`There is no settings revision ${id}`);
    return revisionOf(
      await this.rows.update(
        { id: row.id },
        {
          status: patch.status,
          ...(patch.decidedBy === undefined ? {} : { decidedBy: patch.decidedBy }),
          ...(patch.appliedAt === undefined
            ? {}
            : { appliedAt: patch.appliedAt === null ? null : new Date(patch.appliedAt) }),
        },
      ),
    );
  }
}

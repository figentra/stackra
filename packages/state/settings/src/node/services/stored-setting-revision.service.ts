/**
 * Stackra file contract:
 * Purpose: `StoredSettingRevisionService`, the module service over `StoredSettingRevision`: appends a revision, finds
 *          one, lists a holder's revisions of a group newest first, answers the due scheduled ones, and moves a
 *          revision's state.
 * Boundary: a `CrudService<StoredSettingRevision>`, so every read and write runs in the caller's transaction. A list
 *           names its holder exactly (the node's id, the user, or neither for the root); no read is ever widened by
 *           request input.
 * Runtime: node
 * Governing contract: ADR 0213 (decision 5); ADR 0327 (decisions 3 and 9); ADR 0105 as amended by ADR 0294.
 */
import { CrudService } from "@stackra/database";

import { SettingRevisionStatus } from "#contracts/index";
import type { SettingRevision, SettingTarget } from "#contracts/index";
import type { StoredSettingRevision } from "#node/models/stored-setting-revision.model";

/** The holder columns of `target`. */
function holderOf(
  target: SettingTarget,
): Pick<StoredSettingRevision, "scopeId" | "scopePath" | "userId"> {
  if (target.user !== undefined) return { scopeId: null, scopePath: null, userId: target.user };
  if (target.scope !== undefined)
    return { scopeId: target.scope.id, scopePath: target.scope.path, userId: null };
  return { scopeId: null, scopePath: null, userId: null };
}

/**
 * Reads and stores the settings revisions of this service.
 *
 * @example
 * const due = await revisions.dueAt(new Date());
 */
export class StoredSettingRevisionService extends CrudService<StoredSettingRevision> {
  /** Stores `revision` as a new row. */
  async append(revision: Omit<SettingRevision, "id">): Promise<StoredSettingRevision> {
    return this.insert({
      groupKey: revision.group,
      ...holderOf(revision.target),
      values: { ...revision.values },
      removed: [...revision.removed],
      locked: revision.locked === undefined ? null : [...revision.locked],
      previous: { ...revision.previous },
      author: revision.author,
      reason: revision.reason,
      environment: revision.environment,
      breakGlass: revision.breakGlass,
      status: revision.status,
      effectiveAt: new Date(revision.effectiveAt),
      decidedBy: revision.decidedBy,
      appliedAt: revision.appliedAt === null ? null : new Date(revision.appliedAt),
    });
  }

  /** The revisions of `group` at exactly `target`'s holder, newest first. */
  async listOf(group: string, target: SettingTarget): Promise<StoredSettingRevision[]> {
    const { scopeId, userId } = holderOf(target);
    return this.find({ groupKey: group, scopeId, userId }, { orderBy: { createdAt: "desc" } });
  }

  /** The scheduled revisions due at `at`, oldest first. */
  async dueAt(at: Date): Promise<StoredSettingRevision[]> {
    return this.find(
      { status: SettingRevisionStatus.Scheduled, effectiveAt: { $lte: at } },
      { orderBy: { effectiveAt: "asc" } },
    );
  }
}

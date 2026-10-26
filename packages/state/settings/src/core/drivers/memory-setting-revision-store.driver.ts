/**
 * Stackra file contract:
 * Purpose: `MemorySettingRevisionStoreDriver`, a `SettingRevisionStore` held in memory: for tests, local runs and a
 *          client with no settings service.
 * Boundary: ids are `rev_<n>` in append order; a target's holder is its user, else its node path (`""` for none), as
 *           in the memory value store. Revisions live as long as the instance; reads return the stored objects, which
 *           are frozen.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 5); ADR 0142 (drivers behind a port); ADR 0266 (memory drivers first).
 */
import { Driver } from "@stackra/container";

import { SettingRevisionStatus, SettingRevisionStore } from "#contracts/index";
import type { SettingRevision, SettingTarget } from "#contracts/index";
import { settingHolderOf } from "#core/functions/setting-holder-of.function";

/**
 * Revisions in memory.
 *
 * @example
 * const resolver = new SettingsResolver(values, floors, new MemorySettingRevisionStoreDriver(), clock);
 */
export class MemorySettingRevisionStoreDriver extends Driver(SettingRevisionStore) {
  /** Every revision, in append order. */
  private readonly revisions: SettingRevision[] = [];

  /** Stores `revision` and returns it with its new id. */
  async append(revision: Omit<SettingRevision, "id">): Promise<SettingRevision> {
    const stored = Object.freeze({ ...revision, id: `rev_${this.revisions.length + 1}` });
    this.revisions.push(stored);
    return stored;
  }

  /** The revision `id`, or `null` when there is none. */
  async find(id: string): Promise<SettingRevision | null> {
    return this.revisions.find((revision) => revision.id === id) ?? null;
  }

  /** The revisions of `group` at exactly `target`'s holder, newest first. */
  async list(group: string, target: SettingTarget): Promise<readonly SettingRevision[]> {
    const holder = settingHolderOf(target);
    return this.revisions
      .filter((revision) => revision.group === group && settingHolderOf(revision.target) === holder)
      .reverse();
  }

  /** The scheduled revisions due at or before `at`, oldest first. */
  async due(at: string): Promise<readonly SettingRevision[]> {
    return this.revisions
      .filter(
        (revision) =>
          revision.status === SettingRevisionStatus.Scheduled &&
          Date.parse(revision.effectiveAt) <= Date.parse(at),
      )
      .sort((a, b) => Date.parse(a.effectiveAt) - Date.parse(b.effectiveAt));
  }

  /** Moves revision `id` to `patch` and returns it. */
  async update(
    id: string,
    patch: Pick<SettingRevision, "status"> &
      Partial<Pick<SettingRevision, "decidedBy" | "appliedAt">>,
  ): Promise<SettingRevision> {
    const index = this.revisions.findIndex((revision) => revision.id === id);
    const current = this.revisions[index];
    if (current === undefined) throw new TypeError(`There is no settings revision ${id}`);
    const next = Object.freeze({ ...current, ...patch });
    this.revisions[index] = next;
    return next;
  }
}

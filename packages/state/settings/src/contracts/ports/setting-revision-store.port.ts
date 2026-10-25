/**
 * Stackra file contract:
 * Purpose: the `SettingRevisionStore` port: where settings revisions are kept, for the history, four-eyes approval and
 *          scheduled changes. The memory driver serves tests and local runs; the Postgres driver (`./node`) serves a
 *          service.
 * Boundary: an abstract class that is its own token, keyed `settings.SettingRevisionStore`. It stores revisions and
 *           moves their state; `SettingsResolver` decides the moves and writes values through `SettingValueStore`.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 5); ADR 0359 (decision 4: every change keeps a revision); ADR 0263.
 */
import { Port } from "@stackra/contracts";

import type { SettingRevision } from "#contracts/types/setting-revision.type";
import type { SettingTarget } from "#contracts/types/setting-target.type";

/**
 * Keeps settings revisions.
 *
 * @example
 * export class MemorySettingRevisionStoreDriver extends Driver(SettingRevisionStore) { ... }
 */
export abstract class SettingRevisionStore extends Port {
  /** Type-only port key, so `DriverName<SettingRevisionStore>` narrows to this port's drivers. */
  declare readonly "~key": "settings.SettingRevisionStore";

  /** Stores `revision` and returns it with its new id. */
  abstract append(revision: Omit<SettingRevision, "id">): Promise<SettingRevision>;

  /** The revision `id`, or `null` when there is none. */
  abstract find(id: string): Promise<SettingRevision | null>;

  /** The revisions of `group` at exactly `target`'s holder, newest first. */
  abstract list(group: string, target: SettingTarget): Promise<readonly SettingRevision[]>;

  /** The scheduled revisions whose effective time is at or before `at` (ISO-8601), oldest first. */
  abstract due(at: string): Promise<readonly SettingRevision[]>;

  /**
   * Moves revision `id` to `patch` and returns it.
   *
   * @throws TypeError when there is no revision `id`.
   */
  abstract update(
    id: string,
    patch: Pick<SettingRevision, "status"> &
      Partial<Pick<SettingRevision, "decidedBy" | "appliedAt">>,
  ): Promise<SettingRevision>;
}

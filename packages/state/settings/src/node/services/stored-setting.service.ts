/**
 * Stackra file contract:
 * Purpose: `StoredSettingService`, the module service over `StoredSetting`: reads the rows of a group along a node's
 *          ancestor chain (root first) and a user's row, and stores a holder's values and locks.
 * Boundary: a `CrudService<StoredSetting>`, so every read and write runs in the caller's transaction. The node read
 *           takes the target's path, or the running scope session's `app.scope_path` (`Database.withScope`), which is
 *           the authenticated principal's; outside a session it finds no node row. It never reads a sibling's or a
 *           descendant's row. A store names its holder: a server write without a node or a user is a bug and throws.
 *           The lock check is the driver's.
 * Runtime: node
 * Governing contract: ADR 0213 (decisions 1 and 2); ADR 0327 (decisions 3, 5 and 9); ADR 0105 as amended by ADR
 *                     0294; ADR 0160 (raw SQL in a module service method).
 */
import { CrudService, sql } from "@stackra/database";

import type { SettingTarget, SettingValue } from "#contracts/index";
import type { StoredSetting } from "#node/models/stored-setting.model";

/** The holder columns of `target`'s own row. */
function holderOf(target: SettingTarget): Pick<StoredSetting, "scopeId" | "scopePath" | "userId"> {
  if (target.user !== undefined) return { scopeId: null, scopePath: null, userId: target.user };
  if (target.scope !== undefined)
    return { scopeId: target.scope.id, scopePath: target.scope.path, userId: null };
  throw new TypeError(
    "A stored setting names its holder: pass the node (scope) or the user to write",
  );
}

/**
 * Reads and stores the settings values of this service.
 *
 * @example
 * await stored.store("orders", { scope }, { acceptingOrders: false }, ["acceptingOrders"]);
 * const rows = await stored.chainOf("orders", { scope });
 */
export class StoredSettingService extends CrudService<StoredSetting> {
  /** The rows of `group` that apply at `target`: node rows at and above its node, root first, then the user's row. */
  async chainOf(group: string, target: SettingTarget): Promise<StoredSetting[]> {
    // raw-sql: the ltree ancestor operator `@>` has no typed filter; it uses the GiST index on scope_path
    const above =
      target.scope === undefined
        ? sql`scope_path @> nullif(current_setting('app.scope_path', true), '')::ltree`
        : sql`scope_path @> ${target.scope.path}::ltree`;
    const nodes = await this.find(
      { groupKey: group, $raw: above },
      { orderBy: { scopePath: "asc" } },
    );
    if (target.user === undefined) return nodes;
    const user = await this.findOne({ groupKey: group, userId: target.user });
    return user === null ? nodes : [...nodes, user];
  }

  /**
   * Sets `values` in `target`'s own row of `group`, adding the row when it has none. With `locked`, each written
   * path's lock is set to whether `locked` lists it; without, its lock is kept.
   *
   * @throws TypeError when `target` names neither a node nor a user.
   */
  async store(
    group: string,
    target: SettingTarget,
    values: Readonly<Record<string, SettingValue>>,
    locked?: readonly string[],
  ): Promise<StoredSetting> {
    const holder = holderOf(target);
    const written = Object.keys(values);
    const nextLocked = (current: readonly string[]): string[] =>
      locked === undefined
        ? [...current]
        : [
            ...current.filter((path) => !written.includes(path)),
            ...written.filter((path) => locked.includes(path)),
          ];
    const row = await this.findOne(
      holder.userId === null
        ? { groupKey: group, scopeId: holder.scopeId }
        : { groupKey: group, userId: holder.userId },
    );
    if (row === null)
      return this.insert({
        groupKey: group,
        ...holder,
        values: { ...values },
        locked: nextLocked([]),
      });
    return this.update(
      { id: row.id },
      { values: { ...row.values, ...values }, locked: nextLocked(row.locked) },
    );
  }
}

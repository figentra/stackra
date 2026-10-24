/**
 * Stackra file contract:
 * Purpose: `PostgresSettingValueStoreDriver`, the server's `SettingValueStore`: reads `settings.stored_settings`
 *          through `StoredSettingService` and hands each row on as a layer; a write runs the shared lock check against
 *          the rows above its holder, then stores.
 * Boundary: reads and writes in the caller's transaction and scope session; the node chain comes from the target's
 *           node or the session's, never from request input. It adds no filter beyond the ancestor chain.
 * Runtime: node
 * Governing contract: ADR 0213 (decisions 1 and 2); ADR 0327 (decisions 3 and 9); ADR 0142 (drivers behind a port);
 *                     ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";

import { SettingValueStore } from "#contracts/index";
import type { SettingLayer, SettingTarget, SettingValue } from "#contracts/index";
import { refuseLockedPaths } from "#core/functions/refuse-locked-paths.function";
import type { StoredSetting } from "#node/models/stored-setting.model";
import { StoredSettingService } from "#node/services/stored-setting.service";

/** The layer of one row. */
const layerOf = (row: StoredSetting): SettingLayer => ({ values: row.values, locked: row.locked });

/** Whether `row` is the target's own: its user's row, else its node's. */
const isOwn = (row: StoredSetting, target: SettingTarget): boolean =>
  target.user === undefined
    ? row.userId === null && row.scopePath === target.scope?.path
    : row.userId === target.user;

/**
 * The store over the stored settings table.
 *
 * @example
 * await database.withScope(scope, () => new SettingsReader(store).get(OrdersSettings));
 */
export class PostgresSettingValueStoreDriver extends Driver(SettingValueStore) {
  /** The table's service. */
  private readonly settings: StoredSettingService;

  /** @param settings - the table's service. */
  constructor(settings: StoredSettingService) {
    super();
    this.settings = settings;
  }

  /** See `SettingValueStore.layers`. */
  async layers(group: string, target: SettingTarget): Promise<readonly SettingLayer[]> {
    return (await this.settings.chainOf(group, target)).map(layerOf);
  }

  /** See `SettingValueStore.write`. */
  async write(
    group: string,
    target: SettingTarget,
    values: Readonly<Record<string, SettingValue>>,
    locked?: readonly string[],
  ): Promise<void> {
    const above = (await this.settings.chainOf(group, target)).filter((row) => !isOwn(row, target));
    refuseLockedPaths(above.map(layerOf), Object.keys(values));
    await this.settings.store(group, target, values, locked);
  }
}

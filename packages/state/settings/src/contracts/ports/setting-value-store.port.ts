/**
 * Stackra file contract:
 * Purpose: the `SettingValueStore` port: where the stored values of a settings group live, per holder. The memory
 *          driver serves tests and local runs; the Postgres driver (`./node`) serves a service; a client driver calls
 *          the generated settings operations.
 * Boundary: an abstract class that is its own token, keyed `settings.SettingValueStore`. It stores values and locks
 *           only: defaults, sections and bounds are the class schema's, so a store never needs the settings classes.
 *           Each service keeps its own values (ADR 0213 decision 1); there is no shared key-value table (ADR 0327 d9).
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decisions 1 and 2); ADR 0327 (decision 9); ADR 0294 (decisions 4, 15 and 16); ADR
 *                     0263 (ports resolve by type).
 */
import { Port } from "@stackra/contracts";

import type { SettingLayer } from "#contracts/types/setting-layer.type";
import type { SettingTarget } from "#contracts/types/setting-target.type";
import type { SettingValue } from "#contracts/types/setting-value.type";

/**
 * Reads and writes the stored layers of a settings group.
 *
 * @example
 * export class MemorySettingValueStoreDriver extends Driver(SettingValueStore) {
 *   async layers(group: string, target: SettingTarget): Promise<readonly SettingLayer[]> { ... }
 * }
 */
export abstract class SettingValueStore extends Port {
  /** Type-only port key, so `DriverName<SettingValueStore>` narrows to this port's drivers. */
  declare readonly "~key": "settings.SettingValueStore";

  /**
   * The layers of `group` that apply at `target`, outermost first: the node chain from the root down to the target
   * node, then the user's layer when a user is given. A holder with nothing stored has no layer.
   */
  abstract layers(group: string, target: SettingTarget): Promise<readonly SettingLayer[]>;

  /**
   * Sets each path of `values` in the target's own layer (the user's when a user is given, else the node's). With
   * `locked`, each written path's lock is set to whether `locked` lists it; without, its lock is kept.
   *
   * @throws SettingsLockedError when a holder above the target locks a written path; nothing is written.
   * @throws TypeError when the store cannot tell the target's holder (a server write names its node or user).
   */
  abstract write(
    group: string,
    target: SettingTarget,
    values: Readonly<Record<string, SettingValue>>,
    locked?: readonly string[],
  ): Promise<void>;
}

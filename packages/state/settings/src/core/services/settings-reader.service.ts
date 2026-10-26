/**
 * Stackra file contract:
 * Purpose: `SettingsReader`, the one place settings are read: `get(Class)` resolves a module's group through the scope
 *          cascade (stored layers root first, locks pinned, the user's values last) into an instance of the class with
 *          its defaults and sections, each field that crosses its market's legal floor lifted to it; `read(page)` and
 *          `write(page, values)` serve a settings form.
 * Boundary: a singleton service over the `SettingValueStore` and `SettingFloorSource` ports, so it never knows where
 *           values or floors live; gen's wiring binds both, and a reader built over a store alone reads no floor. `get` parses
 *           the merged values with the class's generated schema (`validate`), which holds the defaults, bounds,
 *           sections and cross-field rules; a stored value that breaks a later schema throws, because a type change is
 *           made through the settings migrator. `write` checks each value against its key before the store is called;
 *           the store refuses a key locked above the target. Approval, client exposure and per-field scopes are the
 *           generated settings operations' to enforce.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 22 to 24); ADR 0213 (decisions 1 and 2); ADR 0294 (decisions 16, 17 and 26);
 *                     ADR 0370 (decision 6); ADR 0395 (decision 4: one reader path honours floors).
 */
import { Service } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import { validate } from "@stackra/validation";

import { SettingFloorSource, SettingValueStore } from "#contracts/index";
import type { SettingTarget, SettingValue } from "#contracts/index";
import type { Settings } from "#core/bases/settings.base";
import { liftFloors } from "#core/functions/lift-floors.function";
import { mergeSettingLayers } from "#core/functions/merge-setting-layers.function";
import { nestSettingValues } from "#core/functions/nest-setting-values.function";
import { settingPageChanges } from "#core/functions/setting-page-changes.function";
import { settingPathInGroup } from "#core/functions/setting-path-in-group.function";
import { settingsKeyOf } from "#core/functions/settings-key-of.function";
import type { SettingsPage } from "#core/types/settings-page.type";
import type { SettingsSnapshot } from "#core/types/settings-snapshot.type";

/**
 * Reads settings for a module or a page.
 *
 * @example
 * const { cancellation } = await this.settings.get(OrdersSettings);
 * const preferences = await this.settings.get(MessagesSettings, { user: event.customerId });
 */
export class SettingsReader extends Service {
  /** Where the values live. */
  private readonly store: SettingValueStore;

  /** The market's legal floors; none when a test builds the reader over a store alone. */
  private readonly floorSource: SettingFloorSource | undefined;

  /**
   * @param store - the selected store driver.
   * @param floorSource - the selected floor source; gen's wiring always passes it, so the default reader of a
   *                      service lifts a value below a legal floor exactly as `SettingsResolver#get` does.
   */
  constructor(store: SettingValueStore, floorSource?: SettingFloorSource) {
    super();
    this.store = store;
    this.floorSource = floorSource;
  }

  /**
   * The resolved group of `type` at `target` (the running scope session's node when left out).
   *
   * @throws TypeError when `type` is not a settings class, or has no registered schema.
   * @throws ZodError when a stored value breaks the class's schema.
   */
  async get<S extends Settings>(type: AnyClass<S>, target: SettingTarget = {}): Promise<S> {
    const group = settingsKeyOf(type);
    const [layers, floors] = await Promise.all([
      this.store.layers(group, target),
      this.floorSource?.floors(group, target) ?? [],
    ]);
    const resolved = validate(type, nestSettingValues(mergeSettingLayers(layers).values));
    if (!resolved.success) throw resolved.error;
    return liftFloors(resolved.data, floors);
  }

  /** The resolved value of each key of `page` by field name, its default when no holder stores one. */
  async read(page: SettingsPage, target: SettingTarget = {}): Promise<SettingsSnapshot> {
    const merged = mergeSettingLayers(await this.store.layers(page.key, target));
    const values: Record<string, SettingValue> = {};
    const locked: string[] = [];
    for (const key of page.fields) {
      const path = settingPathInGroup(key);
      values[key.name] = Object.hasOwn(merged.values, path)
        ? (merged.values[path] ?? null)
        : key.default;
      if (merged.locked.includes(path)) locked.push(key.name);
    }
    return { values, locked };
  }

  /**
   * Stores `values`, keyed by field name, of `page` at `target`'s own holder.
   *
   * @throws SettingValueInvalidError when a name is not a key of the page or its value breaks the key; nothing is
   *         written.
   * @throws SettingsLockedError when a holder above the target locks a written key.
   */
  async write(
    page: SettingsPage,
    values: Readonly<Record<string, unknown>>,
    target: SettingTarget = {},
  ): Promise<void> {
    const { changes } = settingPageChanges(page, values);
    await this.store.write(page.key, target, changes);
  }
}

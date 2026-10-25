/**
 * Stackra file contract:
 * Purpose: `SettingsReader`, the one place settings are read: `get(Class)` resolves a module's group through the scope
 *          cascade (stored layers root first, locks pinned, the user's values last) into an instance of the class with
 *          its defaults and sections; `read(page)` and `write(page, values)` serve a settings form.
 * Boundary: a singleton service over the `SettingValueStore` port, so it never knows where values live. `get` parses
 *           the merged values with the class's generated schema (`validate`), which holds the defaults, bounds,
 *           sections and cross-field rules; a stored value that breaks a later schema throws, because a type change is
 *           made through the settings migrator. `write` checks each value against its key before the store is called;
 *           the store refuses a key locked above the target. Approval, client exposure and per-field scopes are the
 *           generated settings operations' to enforce.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 22 to 24); ADR 0213 (decisions 1 and 2); ADR 0294 (decisions 16, 17 and 26).
 */
import { Service } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import { validate } from "@stackra/validation";

import { SettingValueStore } from "#contracts/index";
import type { SettingTarget, SettingValue } from "#contracts/index";
import type { Settings } from "#core/bases/settings.base";
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

  /** @param store - the selected store driver. */
  constructor(store: SettingValueStore) {
    super();
    this.store = store;
  }

  /**
   * The resolved group of `type` at `target` (the running scope session's node when left out).
   *
   * @throws TypeError when `type` is not a settings class, or has no registered schema.
   * @throws ZodError when a stored value breaks the class's schema.
   */
  async get<S extends Settings>(type: AnyClass<S>, target: SettingTarget = {}): Promise<S> {
    const { values } = mergeSettingLayers(await this.store.layers(settingsKeyOf(type), target));
    const resolved = validate(type, nestSettingValues(values));
    if (!resolved.success) throw resolved.error;
    return resolved.data;
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

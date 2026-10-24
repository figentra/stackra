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
import { SettingValueInvalidError } from "#core/errors/setting-value-invalid.error";
import { isSettingValue } from "#core/functions/is-setting-value.function";
import { mergeSettingLayers } from "#core/functions/merge-setting-layers.function";
import { settingsKeyOf } from "#core/functions/settings-key-of.function";
import type { SettingKey } from "#core/types/setting-key.type";
import type { SettingsPage } from "#core/types/settings-page.type";
import type { SettingsSnapshot } from "#core/types/settings-snapshot.type";

/** A key's path relative to its group: `<section>.<name>`, or `<name>` outside a section. */
const pathInGroup = (key: SettingKey): string =>
  key.section === undefined ? key.name : `${key.section}.${key.name}`;

/** Flat paths as one object, a `<section>.<field>` path as a field of its section (one level deep). */
function nest(values: Readonly<Record<string, SettingValue>>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [path, value] of Object.entries(values)) {
    const dot = path.indexOf(".");
    if (dot === -1) {
      out[path] = value;
      continue;
    }
    const section = path.slice(0, dot);
    const current = out[section];
    const inner =
      typeof current === "object" && current !== null
        ? (current as Record<string, unknown>)
        : (out[section] = {} as Record<string, unknown>);
    inner[path.slice(dot + 1)] = value;
  }
  return out;
}

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
    const resolved = validate(type, nest(values));
    if (!resolved.success) throw resolved.error;
    return resolved.data;
  }

  /** The resolved value of each key of `page` by field name, its default when no holder stores one. */
  async read(page: SettingsPage, target: SettingTarget = {}): Promise<SettingsSnapshot> {
    const merged = mergeSettingLayers(await this.store.layers(page.key, target));
    const values: Record<string, SettingValue> = {};
    const locked: string[] = [];
    for (const key of page.fields) {
      const path = pathInGroup(key);
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
    const changes: Record<string, SettingValue> = {};
    const refused: string[] = [];
    for (const [name, value] of Object.entries(values)) {
      const key = page.fields.find((field) => field.name === name);
      if (key !== undefined && isSettingValue(key, value)) changes[pathInGroup(key)] = value;
      else refused.push(key?.path ?? `${page.key}.${name}`);
    }
    if (refused.length > 0)
      throw SettingValueInvalidError.create(
        { keys: refused },
        { fieldErrors: Object.fromEntries(refused.map((path) => [path, "setting_value_invalid"])) },
      );
    await this.store.write(page.key, target, changes);
  }
}

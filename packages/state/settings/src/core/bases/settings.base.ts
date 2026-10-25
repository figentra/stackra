/**
 * Stackra file contract:
 * Purpose: `Settings`, the kind base of a module's settings group: `class OrdersSettings extends Settings({ scopes,
 *          navigation })` in `<module>.settings.ts`. Its fields are the settings (initializers are the defaults), a
 *          field typed by a schema class is a section, and `rules(r)` holds the cross-field rules.
 * Boundary: called only. The call checks and records its options in the kind registry; gen and `@Setting` read them
 *           through `kindOf`. The base keeps no state and its brand is protected and type-only, so `Fields<X>` is
 *           exactly the declared fields and gen's `X$Check` holds. The group key is derived from the class name.
 *           Sections nest one level deep and a setting is never a secret: gen refuses `settings_too_deep` and
 *           `secret_in_settings` (ADR 0307 rules 22 and 23).
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 22 to 24); ADR 0294 (decisions 16, 20 and 25); ADR 0305 (rules 2 and 3); ADR
 *                     0213 (decision 2).
 */
import { createKind } from "@stackra/container";

import type { SettingsClass } from "#core/types/settings-class.type";
import type { SettingsOptions } from "#core/types/settings-options.type";
import type { SettingsRule } from "#core/types/settings-rule.type";
import type { SettingsRules } from "#core/types/settings-rules.type";

/** The instance side every settings class shares. */
export abstract class SettingsBase {
  /** Type-only kind brand; protected, so it is not in `keyof` and never counts as a field. */
  declare protected readonly "~kind": "settings";

  /**
   * The group's cross-field rules; none unless a subclass overrides it. Gen reads the calls from the syntax tree and
   * compiles them into the group's schema.
   */
  rules(_r: SettingsRules<this>): readonly SettingsRule[] {
    return [];
  }
}

/** A settings instance. */
export type Settings = SettingsBase;

/**
 * Checks `options` and fills in the defaults.
 *
 * @throws RangeError when `scopes` is empty, repeats a level or holds an empty key.
 */
function readSettingsOptions(options: SettingsOptions): Readonly<Record<string, unknown>> {
  const { scopes, navigation } = options;
  if (scopes.length === 0) throw new RangeError("Settings({ scopes }) names at least one level");
  if (scopes.includes("") || new Set(scopes).size !== scopes.length)
    throw new RangeError(`Settings({ scopes }) names each level once: ${JSON.stringify(scopes)}`);
  return {
    scopes: Object.freeze([...scopes]),
    navigation: navigation === undefined ? null : Object.freeze({ ...navigation }),
  };
}

/**
 * The settings kind base.
 *
 * @example
 * export class InventorySettings extends Settings({
 *   scopes: [SettingScope.Platform, SettingScope.Product],
 *   navigation: { group: I18n.inventory.nav.stock, icon: Icons.Warehouse, order: 30 },
 * }) {
 *   @Int({ min: 0 })
 *   @Setting({ client: true })
 *   lowStockThreshold = 5;
 * }
 */
export const Settings = createKind("settings", SettingsBase, readSettingsOptions) as (
  options: SettingsOptions,
) => SettingsClass;

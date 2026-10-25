/**
 * Stackra file contract:
 * Purpose: `settingKeys(tree)`, which builds the typed setting keys of a member's generated `#stackra/settings`
 *          (`Settings.orders.customersMayCancel`) from the metadata gen wrote, and `pick`, which derives a shape class
 *          from a list of keys for a form that edits keys of several modules.
 * Boundary: derives each key's full path from its module, section and name, freezes the result and records each
 *           module's keys for `settingsPage`. A picked class is a schema class that records its keys' paths in the
 *           kind registry, as `PickType` records its base and keys; gen compiles its schema. Holds no value.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 22 and 24); ADR 0294 (decisions 20, 25 and 26); registry v3.1 section 5.
 */
import { registerKind } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import { Schema } from "@stackra/validation";

import { SETTING_KEY_REGISTRY } from "#core/constants/setting-key-registry.constant";
import type { SettingKey } from "#core/types/setting-key.type";
import type { SettingKeyInput } from "#core/types/setting-key-input.type";
import type { SettingKeys } from "#core/types/setting-keys.type";

/** A schema class over `keys`, named for the derivation, with the keys' paths recorded for gen. */
function pick(keys: readonly SettingKey[]): AnyClass<Schema> {
  const Picked = class extends Schema {};
  Object.defineProperty(Picked, "name", { value: "Settings.pick" });
  registerKind(Picked, "schema", { settingKeys: Object.freeze(keys.map((key) => key.path)) });
  return Picked;
}

/**
 * Typed setting keys, by module and name, with `pick`.
 *
 * @throws RangeError when a module is named `pick`, the name of the derivation.
 * @example
 * export const Settings = settingKeys({
 *   orders: {
 *     customersMayCancel: { type: SettingType.Boolean, default: true, section: "cancellation", scopes, label },
 *   },
 * });
 * Settings.orders.customersMayCancel.path; // "orders.cancellation.customersMayCancel"
 */
export function settingKeys<
  const T extends Readonly<Record<string, Readonly<Record<string, SettingKeyInput>>>>,
>(tree: T): SettingKeys<T> {
  if (Object.hasOwn(tree, "pick"))
    throw new RangeError("settingKeys: no module may be named `pick`, the name of the derivation");
  const out: Record<string, unknown> = { pick };
  for (const [module, inputs] of Object.entries(tree)) {
    const group: Record<string, SettingKey> = {};
    for (const [name, input] of Object.entries(inputs)) {
      const path =
        input.section === undefined ? `${module}.${name}` : `${module}.${input.section}.${name}`;
      group[name] = Object.freeze({ ...input, module, name, path });
    }
    SETTING_KEY_REGISTRY.set(module, Object.freeze(Object.values(group)));
    out[module] = Object.freeze(group);
  }
  return Object.freeze(out) as unknown as SettingKeys<T>;
}

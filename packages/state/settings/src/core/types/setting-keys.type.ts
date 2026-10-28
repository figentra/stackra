/**
 * Stackra file contract:
 * Purpose: `SettingKeys<T>`, what `settingKeys(tree)` returns: the typed keys by module and field name, and `pick`,
 *          which turns a list of keys into a shape class with their names as fields and their types as values.
 * Boundary: a type only. A picked class's fields are typed from each key's `type` and `nullable`; its schema is
 *           compiled by gen from the same metadata, as a `PickType` subclass is.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 25 and 26); ADR 0307 (rule 24).
 */
import type { PublicId } from "@stackra/contracts";
import type { ShapeClass } from "@stackra/validation";

import type { SettingKey } from "#core/types/setting-key.type";
import type { SettingKeyInput } from "#core/types/setting-key-input.type";

/** The value type a key holds, from its `type` and `nullable`. */
type ValueOf<I> =
  | (I extends { readonly type: "boolean" }
      ? boolean
      : I extends { readonly type: "integer" | "number" }
        ? number
        : I extends { readonly type: "connection" }
          ? PublicId<"conn">
          : string)
  | (I extends { readonly nullable: true } ? null : never);

/** The fields of the shape `pick(keys)` returns: each key's name to its value type. */
type PickedFields<K extends readonly SettingKey[]> = {
  [E in K[number] as E["name"]]: ValueOf<E>;
};

/**
 * The keys of `T`, by module and name, with `pick`.
 *
 * @example
 * export class OrderPolicySettings extends Settings.pick([Settings.orders.customersMayCancel]) {}
 */
export type SettingKeys<
  T extends Readonly<Record<string, Readonly<Record<string, SettingKeyInput>>>>,
> = {
  readonly [M in keyof T & string]: { readonly [N in keyof T[M] & string]: SettingKey<T[M][N], N> };
} & {
  /** A shape class whose fields are the keys' names, typed and bounded as the keys declare. */
  pick: <const K extends readonly SettingKey[]>(keys: K) => ShapeClass<PickedFields<K>>;
};

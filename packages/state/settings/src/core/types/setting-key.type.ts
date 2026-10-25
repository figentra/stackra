/**
 * Stackra file contract:
 * Purpose: `SettingKey`, one typed setting key as `settingKeys` returns it: the metadata gen wrote, plus its module,
 *          its field name and its full path (`orders.cancellation.customersMayCancel`).
 * Boundary: a type only. The path is the wire key of the setting and of its field error; the name is the key of its
 *           value in a page write. A key holds no value: values are read through `SettingsReader`.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 22 and 24); ADR 0294 (decision 20).
 */
import type { SettingKeyInput } from "#core/types/setting-key-input.type";

/**
 * The key named `N` with metadata `I`.
 *
 * @example
 * Settings.orders.customersMayCancel.path; // "orders.cancellation.customersMayCancel"
 */
export type SettingKey<I = SettingKeyInput, N extends string = string> = I & {
  /** The module that declares it. */
  readonly module: string;

  /** Its field name, the key of its value in a page write. */
  readonly name: N;

  /** `<module>.<section>.<name>`, or `<module>.<name>` outside a section. */
  readonly path: string;
};

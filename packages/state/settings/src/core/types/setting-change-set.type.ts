/**
 * Stackra file contract:
 * Purpose: `SettingChangeSet`, what one revision does to one holder's values of one group: the values it sets, the
 *          paths it removes, and the written paths it locks.
 * Boundary: a type only; `SettingsResolver#applyChange` takes it. `locked` undefined keeps each written path's lock.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decisions 4 and 5); ADR 0359 (decision 6).
 */
import type { SettingValue } from "#contracts/index";

/**
 * One group's change.
 *
 * @example
 * await resolver.applyChange("orders", { scope }, { values: { refundWindowDays: 30 }, removed: [] }, meta);
 */
export interface SettingChangeSet {
  /** The values it sets, by path in the group. */
  readonly values: Readonly<Record<string, SettingValue>>;

  /** The paths whose stored value it removes. */
  readonly removed: readonly string[];

  /** The written paths it locks; undefined keeps each written path's lock. */
  readonly locked?: readonly string[];
}

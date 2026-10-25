/**
 * Stackra file contract:
 * Purpose: `SettingLayer`, the values one holder (a scope node or a user) stores for one settings group, keyed by
 *          their path in the group, the paths it locks for every holder below it, and which holder it is.
 * Boundary: a type only. A path is relative to the group: `acceptingOrders`, or `cancellation.autoCancelAfterMinutes`
 *           for a field of a section (one level deep). The store returns layers outermost first. `holder` is the node's
 *           path (`""` for the root) or `user:<id>`; a store driver sets it, a merged result has none.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 2: the cascade, locks and provenance); ADR 0307 (rule 22: sections).
 */
import type { SettingValue } from "#contracts/types/setting-value.type";

/**
 * One holder's values of a group.
 *
 * @example
 * const platform: SettingLayer = { values: { "cancellation.customersMayCancel": false }, locked: ["cancellation.customersMayCancel"] };
 */
export interface SettingLayer {
  /** The holder's values by path in the group. */
  readonly values: Readonly<Record<string, SettingValue>>;

  /** The paths whose value this holder pins for every holder below it. */
  readonly locked: readonly string[];

  /** The holder: its node path (`""` for the root) or `user:<id>`; absent on a merged result. */
  readonly holder?: string;
}

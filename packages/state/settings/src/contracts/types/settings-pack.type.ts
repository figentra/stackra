/**
 * Stackra file contract:
 * Purpose: `SettingsPack`, one holder's own settings across groups: each group's stored values and locks. It is what
 *          `settings:diff` and `settings:apply` compare and write, the YAML file a product seed ships, and the
 *          snapshot settings promotes from a sandbox to live.
 * Boundary: a type only, plain JSON data; never a secret (a setting never is). A group with nothing stored is absent.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 4: YAML packs, diff and apply); ADR 0280 (decision 1); ADR 0359 (decision 6).
 */
import type { SettingLayer } from "#contracts/types/setting-layer.type";

/**
 * A pack.
 *
 * @example
 * const pack: SettingsPack = { groups: { orders: { values: { refundWindowDays: 30 }, locked: [] } } };
 */
export interface SettingsPack {
  /** Each group's values and locks, by group key. */
  readonly groups: Readonly<Record<string, SettingLayer>>;
}

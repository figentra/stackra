/**
 * Stackra file contract:
 * Purpose: `SettingsChange`, one row of a settings diff: a path of a group whose value or lock differs between a base
 *          pack and the next one.
 * Boundary: a type only, plain JSON (a `PromotionDiff` carries the rows). `before` is absent for an added path,
 *           `after` for a removed one.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 4: `settings:diff`); ADR 0280 (decision 4: reviewed diff).
 */
import type { SettingValue } from "#contracts/index";

/**
 * One changed path.
 *
 * @example
 * const row: SettingsChange = { group: "orders", path: "refundWindowDays", before: 14, after: 30, lockedBefore: false, lockedAfter: false };
 */
export interface SettingsChange {
  /** The settings group that changed. */
  readonly group: string;

  /** The path, relative to the group. */
  readonly path: string;

  /** The base value; absent when the base does not hold the path. */
  readonly before?: SettingValue;

  /** The next value; absent when the next pack does not hold the path. */
  readonly after?: SettingValue;

  /** Whether the base locks it. */
  readonly lockedBefore: boolean;

  /** Whether the next pack locks it. */
  readonly lockedAfter: boolean;
}

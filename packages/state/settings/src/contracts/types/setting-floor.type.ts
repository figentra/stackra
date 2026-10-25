/**
 * Stackra file contract:
 * Purpose: `SettingFloor`, one legal floor on one setting of a group: the value no holder may cross, its side, and the
 *          law, market and pack version that set it.
 * Boundary: a type only. The path is relative to the group, as in `SettingLayer`. The value is a number or a boolean
 *           (`false` below `true`); `settingFloorsOf` builds floors from market-pack data, never from code.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decision 6: floors exposed to settings); ADR 0363 (decision 4); config-model section 3.
 */
import type { FloorBound } from "@stackra/market-packs";

/**
 * A floor on one path.
 *
 * @example
 * const floor: SettingFloor = { path: "refundWindowDays", value: 14, bound: "min", law: "EU 2011/83 art. 9", market: "eu", version: "1.2.0" };
 */
export interface SettingFloor {
  /** The floored path, relative to its group. */
  readonly path: string;

  /** The value no holder may cross. */
  readonly value: number | boolean;

  /** Which side may not be crossed. */
  readonly bound: FloorBound;

  /** The law that sets it, as the pack names it. */
  readonly law: string;

  /** The market whose pack set it. */
  readonly market: string;

  /** That pack's version. */
  readonly version: string;
}

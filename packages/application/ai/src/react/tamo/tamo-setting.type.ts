/**
 * Stackra file contract:
 * Purpose: `TamoSetting`, one level of the Tamo switch: on or off, and whether the level locks the ones under it.
 * Boundary: a type only; the values are the workspace's dashboard data (config, not code), the default is on.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0504 (module UI kits).
 */
/** One level of the Tamo switch. */
export interface TamoSetting {
  /** Whether Tamo is on at this level. */
  readonly isEnabled: boolean;
  /** True to lock this level: a screen or field under it cannot turn Tamo the other way. */
  readonly isLocked?: boolean | undefined;
}

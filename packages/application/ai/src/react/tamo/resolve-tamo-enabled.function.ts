/**
 * Stackra file contract:
 * Purpose: `resolveTamoEnabled`, whether Tamo is on for a screen and a field: a locked workspace level wins, then a locked screen,
 *          then the field's own setting, then the screen's, then the workspace's.
 * Boundary: a pure function over the settings; no default of its own (the provider defaults to on).
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (decision 5: a runtime setting per workspace, screen and field, lockable).
 */
import type { TamoSettings } from "#react/tamo/tamo-settings.type";

/**
 * Whether Tamo is on where a part sits.
 *
 * @example
 * resolveTamoEnabled({ isEnabled: true, screens: { orders: { isEnabled: false } } }, "orders"); // false
 */
export function resolveTamoEnabled(
  settings: TamoSettings,
  screen?: string | undefined,
  field?: string | undefined,
): boolean {
  if (settings.isLocked) return settings.isEnabled;
  const screenSetting = screen === undefined ? undefined : settings.screens?.[screen];
  if (screenSetting?.isLocked) return screenSetting.isEnabled;
  const fieldSetting = field === undefined ? undefined : screenSetting?.fields?.[field];
  return (fieldSetting ?? screenSetting ?? settings).isEnabled;
}

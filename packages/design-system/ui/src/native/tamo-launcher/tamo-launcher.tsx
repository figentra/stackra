/**
 * Stackra file contract:
 * Purpose: the native `TamoLauncher`: the "Ask Tamo" button that opens the Ask Tamo panel (`TamoPanel`, which the AI
 *          module's provider renders once).
 * Boundary: `shortcut` is accepted for one API with web and ignored: a touch screen has no keyboard shortcut (the planned
 *           shortcuts ADR binds keys where there is a keyboard). Draws nothing without the AI module or with Tamo off.
 * Runtime: react-native
 * Governing contract: ADR 0507 (the Ask Tamo launcher).
 */
import type { ReactElement } from "react";

import { TAMO_KEYS } from "#core/constants/tamo-keys.constant";
import { useTamo } from "#react/hooks/use-tamo";
import { useUiText } from "#react/hooks/use-ui-text";
import { TamoButton } from "#native/tamo-button/tamo-button";
import type { TamoLauncherProps } from "#native/tamo-launcher/tamo-launcher.props";

/** The Ask Tamo launcher. */
export function TamoLauncher({
  // Accepted for one API with web; a touch screen has no shortcut to show.
  shortcut: _shortcut,
  label,
  isIconOnly = false,
  className,
}: TamoLauncherProps): ReactElement | null {
  const t = useUiText();
  const tamo = useTamo();
  if (!tamo) return null;
  return (
    <TamoButton
      label={label ?? t(TAMO_KEYS.ui.tamo.ask)}
      isIconOnly={isIconOnly}
      onPress={() => tamo.panel.open()}
      {...(className === undefined ? {} : { className })}
    />
  );
}

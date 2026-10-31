/**
 * Stackra file contract:
 * Purpose: the web `TamoLauncher`: the "Ask Tamo" button with its shortcut hint (`Mod+J` read as `⌘J` or `Ctrl+J`),
 *          which opens the Ask Tamo panel (`TamoPanel`, drawn once by the AI module's provider).
 * Boundary: the shortcut is shown, announced (`aria-keyshortcuts`) and bound through the shortcut registry as the
 *           `ai.ask` action (ADR 0508), so a person can remap it. Draws and binds nothing without the AI module or with
 *           Tamo off for the screen.
 * Runtime: browser
 * Governing contract: ADR 0507 (the Ask Tamo launcher and side panel); ADR 0508 (the `ai.ask` binding); WCAG 2.2 SC
 *          2.1.1, 4.1.2.
 */
import { Kbd } from "@heroui/react";
import { useShortcutAction } from "@stackra/shortcuts/react";
import type { ReactElement } from "react";

import { TAMO_KEYS } from "#core/constants/tamo-keys.constant";
import { useTamo } from "#react/hooks/use-tamo";
import { useUiText } from "#react/hooks/use-ui-text";
import { TamoButton } from "#react/tamo-button/tamo-button";
import type { TamoLauncherProps } from "#react/tamo-launcher/tamo-launcher.props";

/** `Mod+J` as read on this device: `⌘J` on Apple, `Ctrl+J` elsewhere. */
function shortcutText(shortcut: string): string {
  const isApple = typeof navigator !== "undefined" && /Mac|iPhone|iPad/u.test(navigator.userAgent);
  return isApple ? shortcut.replace(/Mod\+/u, "⌘") : shortcut.replace(/Mod/u, "Ctrl");
}

/** The Ask Tamo launcher. */
export function TamoLauncher({
  shortcut = "Mod+J",
  label,
  isIconOnly = false,
  className,
}: TamoLauncherProps): ReactElement | null {
  const t = useUiText();
  const tamo = useTamo();
  useShortcutAction(
    tamo
      ? {
          id: "ai.ask",
          label: label ?? t(TAMO_KEYS.ui.tamo.ask),
          shortcut: shortcut.toLowerCase(),
          scope: "app",
          run: () => tamo.panel.open(),
        }
      : undefined,
  );
  if (!tamo) return null;
  const keys = shortcutText(shortcut);
  return (
    <span data-slot="tamo-launcher" className="inline-flex items-center gap-2">
      <TamoButton
        label={label ?? t(TAMO_KEYS.ui.tamo.ask)}
        isIconOnly={isIconOnly}
        aria-keyshortcuts={shortcut.replace("Mod", "Meta")}
        aria-description={t(TAMO_KEYS.ui.tamo.shortcut, { keys })}
        onPress={() => tamo.panel.open()}
        {...(className === undefined ? {} : { className })}
      />
      {isIconOnly ? null : (
        <Kbd aria-hidden className="hidden sm:inline-flex">
          <Kbd.Content>{keys}</Kbd.Content>
        </Kbd>
      )}
    </span>
  );
}

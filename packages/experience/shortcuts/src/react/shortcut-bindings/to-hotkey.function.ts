/**
 * Stackra file contract:
 * Purpose: `toHotkey`, which spells one normal-form step (`mod+shift+l`) the way the keyboard driver, TanStack Hotkeys,
 *          names it (`Mod+Shift+L`).
 * Boundary: pure and internal to the bindings; the only place the driver's spelling appears, so apps never see it.
 * Runtime: browser
 * Governing contract: registry v3.1 R-66 (the web and desktop driver is TanStack Hotkeys; apps never import it).
 */
import { KEY_NAMES } from "#core/constants/key-names.constant";

/**
 * The driver's spelling of a normal-form step.
 *
 * @example
 * toHotkey("mod+shift+l"); // "Mod+Shift+L"
 * toHotkey("pageup"); // "PageUp"
 */
export function toHotkey(step: string): string {
  return step
    .split("+")
    .map((name) => KEY_NAMES[name]?.hotkey ?? name.toUpperCase())
    .join("+");
}

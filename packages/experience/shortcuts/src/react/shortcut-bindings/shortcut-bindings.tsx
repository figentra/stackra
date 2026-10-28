/**
 * Stackra file contract:
 * Purpose: `ShortcutBindings`, the keyboard half of the shortcuts: mounted once by the generated app entry inside the
 *          `ContainerProvider`, it binds every registered shortcut that has keys and that the container binds, so a
 *          key press runs the same class the palette and the menus run.
 * Boundary: renders nothing. Binds through TanStack Hotkeys' singleton managers: a plain binding as a hotkey, a chord
 *           as a sequence that waits `CHORD_TIMEOUT` for each next step. The instance is resolved and the context
 *           built at the moment of the key press. Unbinds everything on unmount or when the container changes.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 23); registry v3.1 R-66 (TanStack Hotkeys, apps never import it) and final
 *                     review H (chords, 1.5 s timeout).
 */
import { useContainer } from "@stackra/container/react";
import {
  getHotkeyManager,
  getSequenceManager,
  type HotkeySequence,
  type RegisterableHotkey,
} from "@tanstack/hotkeys";
import { useEffect } from "react";

import { CHORD_TIMEOUT } from "#core/constants/chord-timeout.constant";
import { SHORTCUT_ENTRIES } from "#core/constants/shortcut-entries.constant";
import { createShortcutContext } from "#core/functions/create-shortcut-context.function";
import { toHotkey } from "#react/shortcut-bindings/to-hotkey.function";

/**
 * Binds the registered shortcuts' keys while mounted.
 *
 * @throws Error outside a `ContainerProvider`.
 * @example
 * <ContainerProvider container={container}>
 *   <ShortcutBindings />
 *   <App />
 * </ContainerProvider>
 */
export function ShortcutBindings(): null {
  const container = useContainer();
  useEffect(() => {
    const handles: { unregister: () => void }[] = [];
    for (const entry of SHORTCUT_ENTRIES.values()) {
      if (entry.steps.length === 0 || !container.has(entry.type)) continue;
      const run = () => {
        void container.get(entry.type).run(createShortcutContext());
      };
      const [first, ...rest] = entry.steps.map(toHotkey);
      handles.push(
        rest.length === 0
          ? getHotkeyManager().register(first as RegisterableHotkey, run)
          : getSequenceManager().register([first, ...rest] as HotkeySequence, run, {
              timeout: CHORD_TIMEOUT,
            }),
      );
    }
    return () => {
      for (const handle of handles) handle.unregister();
    };
  }, [container]);
  return null;
}

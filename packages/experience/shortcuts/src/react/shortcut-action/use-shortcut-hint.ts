/**
 * Stackra file contract:
 * Purpose: `useShortcutHint(action)`, the hint of one action without registering it: the binding in force (remaps,
 *          RTL mirror), its drawn and spoken forms, `aria-keyshortcuts`, the hint mode and the reveal state.
 * Boundary: works without a provider (platform settings, no reveal). Re-renders when the settings change or Mod is held.
 * Runtime: browser
 * Governing contract: ADR 0508.
 */
import { use, useSyncExternalStore } from "react";

import { effectiveShortcutKeys } from "#core/functions/effective-shortcut-keys.function";
import { formatShortcutKeys } from "#core/functions/format-shortcut-keys.function";
import { toAriaKeyShortcuts } from "#core/functions/to-aria-key-shortcuts.function";
import type { ShortcutHintState } from "#react/shortcut-action/shortcut-hint-state.type";
import { ShortcutRegistryContext } from "#react/shortcut-provider/shortcut-registry-context";

/** A fine pointer (mouse or trackpad) means a keyboard is likely; a touch screen waits for a key press. */
const hasFinePointer = () =>
  typeof matchMedia === "function" && matchMedia("(pointer: fine)").matches;

/**
 * The hint of an action.
 *
 * @example
 * const hint = useShortcutHint({ id: "doc.save", shortcut: "mod+s" });
 * <button aria-keyshortcuts={hint.ariaKeyShortcuts}>Save {hint.display?.steps}</button>
 */
export function useShortcutHint(
  action:
    | {
        readonly id: string;
        readonly shortcut?: string | undefined;
        readonly isDirectional?: boolean | undefined;
      }
    | undefined,
): ShortcutHintState {
  const { registry, settings, apple, rtl, isMounted } = use(ShortcutRegistryContext);
  const isRevealed = useSyncExternalStore(registry.subscribeView, registry.isRevealed, () => false);
  const keyboard = useSyncExternalStore(
    registry.subscribeView,
    () => registry.hasKeyboard() || hasFinePointer() || !isMounted,
    () => true,
  );
  const keys =
    action === undefined || !settings.enabled
      ? undefined
      : effectiveShortcutKeys(action, settings, rtl);
  return {
    keys,
    display: keys === undefined ? undefined : formatShortcutKeys(keys, apple),
    ariaKeyShortcuts: keys === undefined ? undefined : toAriaKeyShortcuts(keys, apple),
    hintMode: settings.hintMode,
    showHints: settings.enabled && keyboard,
    isRevealed,
  };
}

/**
 * Stackra file contract:
 * Purpose: `useShortcutAction(action)`, the one hook a shortcut-aware component calls: registers the action while
 *          mounted and returns its hint.
 * Boundary: `undefined` registers nothing and returns an empty hint, so a component can call it unconditionally.
 * Runtime: browser
 * Governing contract: ADR 0508.
 */
import type { ShortcutAction } from "#core/types/shortcut-action.type";
import type { ShortcutHintState } from "#react/shortcut-action/shortcut-hint-state.type";
import { useShortcutActions } from "#react/shortcut-action/use-shortcut-actions";
import { useShortcutHint } from "#react/shortcut-action/use-shortcut-hint";

/** No actions, shared so the empty case does not re-register. */
const NONE: readonly ShortcutAction[] = [];

/**
 * Registers `action` and returns its hint.
 *
 * @example
 * const hint = useShortcutAction({ id: "doc.save", label: t("save"), shortcut: "mod+s", run: save });
 */
export function useShortcutAction(action: ShortcutAction | undefined): ShortcutHintState {
  useShortcutActions(action === undefined ? NONE : [action]);
  return useShortcutHint(action);
}

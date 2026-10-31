/**
 * Stackra file contract:
 * Purpose: `ShortcutHintState`, what an action's hint needs to draw: the binding in force, its drawn and spoken forms,
 *          the `aria-keyshortcuts` value, the hint mode, whether hints show at all (on, a hardware keyboard) and
 *          whether Mod is held to reveal the badges.
 * Boundary: a type only; `useShortcutHint` builds it.
 * Runtime: isomorphic
 * Governing contract: ADR 0508 (hint modes, hold-Mod badges, aria-keyshortcuts).
 */
import type { ShortcutHintMode } from "#core/enums/shortcut-hint-mode.enum";
import type { ShortcutKeysDisplay } from "#core/types/shortcut-keys-display.type";

/** One action's hint. */
export interface ShortcutHintState {
  /** The binding in force, normal form; absent when the action has none. */
  readonly keys?: string | undefined;
  /** How it is drawn and spoken on this platform. */
  readonly display?: ShortcutKeysDisplay | undefined;
  /** The `aria-keyshortcuts` value; absent for a chord or no binding. */
  readonly ariaKeyShortcuts?: string | undefined;
  /** `visible` or `hidden`. */
  readonly hintMode: ShortcutHintMode;
  /** False when shortcuts are off, or on a touch screen with no hardware keyboard seen. */
  readonly showHints: boolean;
  /** True while Mod is held: badges show over every visible action. */
  readonly isRevealed: boolean;
}

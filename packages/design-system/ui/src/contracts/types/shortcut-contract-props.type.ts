/**
 * Stackra file contract:
 * Purpose: `ShortcutContractProps`, the props that make an action shortcut-aware on every runtime: a key binding
 *          (`shortcut="mod+s"`) with an optional stable id for remaps, or a whole `action` definition that also gives
 *          the label, icon, handler, `when` and permission.
 * Boundary: types only. On web the component registers the binding with the nearest `ShortcutProvider`, draws the hint
 *           (an inline HeroUI Kbd when hints are visible, the tooltip when hidden, a badge while Mod is held) and sets
 *           `aria-keyshortcuts`. On native the props are accepted and draw nothing yet (ADR 0508 decision 11).
 * Runtime: isomorphic
 * Governing contract: ADR 0508 (one action definition; hint modes).
 */
import type { ShortcutAction } from "@stackra/shortcuts";

/** The shortcut props of an action component. */
export interface ShortcutContractProps {
  /**
   * The key binding that runs this action: modifiers and one key joined by `+` (`mod+s`, `shift+/`), or a two-key
   * sequence (`g o`). `mod` is Command on Apple devices and Control elsewhere.
   */
  readonly shortcut?: string | undefined;
  /** A stable id for the binding (`orders.create`), which a person's remap keys on. Defaults to `keys:<binding>`. */
  readonly shortcutId?: string | undefined;
  /** The whole action: its id, words, icon, binding, handler, `when` and permission, defined once. */
  readonly action?: ShortcutAction | undefined;
}

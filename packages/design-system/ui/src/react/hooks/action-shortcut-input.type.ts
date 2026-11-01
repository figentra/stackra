/**
 * Stackra file contract:
 * Purpose: `ActionShortcutInput`, what a component hands `useActionShortcut`: the binding or the whole action, its
 *          words and handler, availability, scope and whether there is room for an inline hint.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0508.
 */
import type { ShortcutAction, ShortcutScope } from "@stackra/shortcuts";

/** What a component hands the hook. */
export interface ActionShortcutInput {
  /** The binding (`mod+s`); with no binding and no `action`, the hook does nothing. */
  readonly shortcut?: string | undefined;
  /** The binding's stable id, for remaps. */
  readonly shortcutId?: string | undefined;
  /** A whole action definition; its fields win over the loose ones. */
  readonly action?: ShortcutAction | undefined;
  /** The words of the action (the registry and the tooltip). */
  readonly label?: string | undefined;
  /** What the key runs: the component's press handler. */
  readonly run?: (() => void) | undefined;
  /** True to leave the action unregistered, so its key does nothing. */
  readonly isDisabled?: boolean | undefined;
  /** Where the key listens; `page` by default. */
  readonly scope?: ShortcutScope | undefined;
  /** The cheat sheet group the action is listed under. */
  readonly group?: string | undefined;
  /** True when the binding mirrors (Left and Right swap) on a right-to-left page. */
  readonly isDirectional?: boolean | undefined;
  /** False for a control with no room for an inline hint (an icon button): the keys go in its tooltip. */
  readonly canInline?: boolean | undefined;
}

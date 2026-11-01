/**
 * Stackra file contract:
 * Purpose: `ShortcutKeyPress`, a key press with the element it happened in, its IME state and its `preventDefault`; a DOM `KeyboardEvent` fits it.
 * Boundary: a type only; internal to `./react`.
 * Runtime: isomorphic
 * Governing contract: ADR 0508.
 */
import type { ShortcutKeyEvent } from "#core/types/shortcut-key-event.type";

/** A key press. */
export type ShortcutKeyPress = ShortcutKeyEvent & {
  readonly target: unknown;
  readonly isComposing?: boolean;
  readonly keyCode?: number;
  readonly preventDefault: () => void;
  /** Stops the key reaching the focused widget once a shortcut consumed it. */
  readonly stopPropagation?: () => void;
};

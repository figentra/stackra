/**
 * Stackra file contract:
 * Purpose: `KeyName`, how one named key or modifier of a key binding is shown, spoken and handed to the keyboard
 *          driver, on Apple devices and elsewhere.
 * Boundary: a type only; the table is `KEY_NAMES`. Internal to the package: the key hint and the bindings read it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 23); registry v3.1 R-66 (display is ours, the driver is TanStack Hotkeys).
 */

/** The faces of one named key. */
export interface KeyName {
  /** The key as the driver names it (`Mod`, `ArrowUp`). */
  readonly hotkey: string;

  /** The glyph or text shown on Apple devices (`⌘`, `↑`). */
  readonly apple: string;

  /** The text shown elsewhere (`Ctrl`, `↑`). */
  readonly other: string;

  /** The words a screen reader says on Apple devices (`Command`). */
  readonly appleWords: string;

  /** The words a screen reader says elsewhere (`Control`). */
  readonly otherWords: string;
}

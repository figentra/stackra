/**
 * Stackra file contract:
 * Purpose: `ShortcutKeysDisplay`, how a binding is drawn and spoken on one platform, as `formatShortcutKeys` builds it.
 * Boundary: a type only, internal to the package; `ShortcutKeys` renders it.
 * Runtime: isomorphic
 * Governing contract: registry v3.1 R-66 (display is ours); the template's shortcuts README (the platform's modifier).
 */

/** A binding, ready to draw. */
export interface ShortcutKeysDisplay {
  /** One text per step: `⌘⇧L` on Apple devices, `Ctrl+Shift+L` elsewhere. */
  readonly steps: readonly string[];

  /** What a screen reader says: `Command Shift L`, a chord's steps joined by `, then `. */
  readonly spoken: string;
}

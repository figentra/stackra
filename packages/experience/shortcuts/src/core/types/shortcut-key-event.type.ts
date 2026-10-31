/**
 * Stackra file contract:
 * Purpose: `ShortcutKeyEvent`, the fields of a key press that matching reads: the physical key (`code`), the typed key
 *          and the modifiers. A DOM `KeyboardEvent` fits it.
 * Boundary: a type only, so matching stays pure and testable without a DOM.
 * Runtime: isomorphic
 * Governing contract: ADR 0508 (matching on `event.code`).
 */

/** A key press. */
export interface ShortcutKeyEvent {
  /** The physical key (`KeyK`, `Slash`), the same on every keyboard layout; empty when unknown. */
  readonly code?: string;
  /** The typed key (`k`, `ك`), used only when `code` is unknown. */
  readonly key: string;
  readonly metaKey: boolean;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
  readonly shiftKey: boolean;
}

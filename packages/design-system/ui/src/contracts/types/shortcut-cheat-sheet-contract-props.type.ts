/**
 * Stackra file contract:
 * Purpose: `ShortcutCheatSheetContractProps`, what the shortcuts reference takes: its open state (controlled or not)
 *          and the key that opens it.
 * Boundary: types only; the rows come from the shortcut registry, never from props.
 * Runtime: isomorphic
 * Governing contract: ADR 0508 (the cheat sheet is generated from the registry).
 */

/** Props of the shortcuts cheat sheet. */
export interface ShortcutCheatSheetContractProps {
  /** Whether the sheet is open, controlled. */
  readonly isOpen?: boolean | undefined;
  /** Called when the sheet opens or closes. */
  readonly onOpenChange?: ((isOpen: boolean) => void) | undefined;
  /** The binding that opens it; `false` registers none. Defaults to `shift+/` (the `?` key). */
  readonly shortcut?: string | false | undefined;
}

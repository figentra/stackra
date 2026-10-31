/**
 * Stackra file contract:
 * Purpose: `ShortcutCheatSheetProps`, the props of the web `ShortcutCheatSheet`: the shared contract.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0508.
 */
import type { ShortcutCheatSheetContractProps } from "#contracts/types/shortcut-cheat-sheet-contract-props.type";

/** Props of the web cheat sheet. */
export type ShortcutCheatSheetProps = ShortcutCheatSheetContractProps;

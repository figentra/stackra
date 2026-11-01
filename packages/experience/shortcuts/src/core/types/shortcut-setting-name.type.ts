/**
 * Stackra file contract:
 * Purpose: `ShortcutSettingName`, a field of the shortcut settings a layer can lock for the layers below it.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0508 (three settings layers, tenant lock).
 */

/** A lockable shortcut setting. */
export type ShortcutSettingName = "enabled" | "hintMode" | "singleKey" | "remaps";

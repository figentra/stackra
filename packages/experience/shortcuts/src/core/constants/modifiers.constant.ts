/**
 * Stackra file contract:
 * Purpose: `MODIFIERS`, the modifiers a key binding may hold, in the one order the normal form writes them.
 * Boundary: data only. `mod` is Command on Apple devices and Control elsewhere; the conflict detector resolves it per
 *           platform.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 23); registry v3.1 final review H (conflict checks).
 */

/** The modifiers, in normal-form order. */
export const MODIFIERS: readonly string[] = Object.freeze(["mod", "ctrl", "alt", "shift", "meta"]);

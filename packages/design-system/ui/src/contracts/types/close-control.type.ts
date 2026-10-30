/**
 * Stackra file contract:
 * Purpose: `CloseControl`, how an overlay header's close control is drawn: `"esc"` one button showing the Escape key
 *          cap (the close mark on a coarse pointer, which has no Escape key), `"icon"` the close mark, `"both"` the key
 *          cap and the close mark in that one button, `"none"` no control (Escape and the backdrop still close).
 * Boundary: a type only; web draws it, native always draws the close mark (a phone has no Escape key).
 * Runtime: isomorphic
 * Governing contract: STA-1371 (owner, 2026-10-29: "esc only or make it props").
 */
/** How a person can close an overlay: Escape, a close mark, both or neither. */
export type CloseControl = "esc" | "icon" | "both" | "none";

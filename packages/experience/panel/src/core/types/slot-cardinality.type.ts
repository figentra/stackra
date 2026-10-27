/**
 * Stackra file contract:
 * Purpose: `SlotCardinality`, how many fills a shell slot takes: `one` (the highest layer's fill replaces the shell's
 *          default, as a whole sign-in page does) or `many` (every fill is drawn, as footer links are).
 * Boundary: a type only; `defineSlot` defaults it to `one`, and gen refuses two fills of a `one` slot in a member
 *           (`slot_fill_duplicate`).
 * Runtime: isomorphic
 * Governing contract: ADR 0438 (slots, not shadowing); app-shells-edge-and-extension.md sections 7.1 and 7.2.
 */

/** How many fills a slot takes. */
export type SlotCardinality = "one" | "many";

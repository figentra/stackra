/**
 * Stackra file contract:
 * Purpose: `SlotKey<P>`, the slot names of extension point `P`: its properties that are `after` or `before` slots.
 * Boundary: a type only; what `extension(Point, slot, ...)` accepts, so a misspelled slot is a compile error.
 * Runtime: node
 * Governing contract: ADR 0305 (rules 23 and 25).
 */
import type { AnySlot } from "#core/index";

/** The slot property names of `P`. */
export type SlotKey<P> = { [K in keyof P]: P[K] extends AnySlot ? K : never }[keyof P] & string;

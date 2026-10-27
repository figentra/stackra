/**
 * Stackra file contract:
 * Purpose: `ExtensionClass<S>`, the exported class type the called form `Extension<Point["slot"]>({...})` returns, so
 *          a consumer's `extends Extension<Slot>({ order })` class has a nameable base in its declaration emit (TS2883,
 *          STA-1220), as `ActionClass` gives `Action({...})`.
 * Boundary: a type only; its instance is the exported `Extension<S>`.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 22 to 25); STA-1220 (self-contained declaration emit).
 */
import type { Extension } from "#core/bases/extension.base";
import type { AnySlot } from "#core/types/any-slot.type";

/** The base class of one extension of slot `S`. */
export type ExtensionClass<S extends AnySlot> = abstract new () => Extension<S>;

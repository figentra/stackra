/**
 * Stackra file contract:
 * Purpose: `SlotHandler<S>`, the signature an extension's `handle` has for slot `S`: an `after` handler takes the value,
 *          the slot's arguments and the context and returns the value; a `before` handler takes the arguments and the
 *          context and returns replacement arguments or nothing.
 * Boundary: a type only, read by `Extension<S>` to declare its abstract `handle` (the shape the partner spike proved:
 *           a method typed from the slot, never a method named after it, which TypeScript refuses with TS2425).
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 23 and 25); the STA-409 partner spike (shape E3).
 */
import type { AfterSlot } from "#core/types/after-slot.type";
import type { BeforeSlot } from "#core/types/before-slot.type";
import type { ExtensionContext } from "#core/types/extension-context.type";

/** The `handle` signature of an extension of slot `S`. */
export type SlotHandler<S> =
  S extends AfterSlot<infer V, infer A>
    ? (value: V, ...args: [...A, ctx: ExtensionContext]) => V | Promise<V>
    : S extends BeforeSlot<infer A>
      ? // oxlint-disable-next-line typescript/no-invalid-void-type -- reason: a before-handler may return nothing to keep the arguments
        (...args: [...A, ctx: ExtensionContext]) => A | void | Promise<A | void>
      : never;

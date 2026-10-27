/**
 * Stackra file contract:
 * Purpose: `Extension<Point["slot"]>`, the kind base of one implementer of one slot of another module's extension
 *          point, in both forms: `extends Extension<OrderExtensionPoint["verifyPlacement"]>` and
 *          `extends Extension<OrderExtensionPoint["adjustTotals"]>({ order, input })`. Its one `handle` method is typed
 *          from the slot, so a wrong parameter, a wrong return or a misspelled slot is a compile error.
 * Boundary: a binding with constructor dependencies. The slot is the type argument only (gone at runtime); gen reads it
 *           and registers the class with `registerExtensions`. One class per slot; a second slot is a second class.
 *           A called form without the type argument fails with a readable hint (`WithPartner`).
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 5, 22 to 25 and 44); the STA-409 partner spike (shape E3); ADR 0265 as amended.
 */
import { createKind, type WithPartner } from "@stackra/container";

import type { AnySlot } from "#core/types/any-slot.type";
import type { ExtensionClass } from "#core/types/extension-class.type";
import type { ExtensionOptions } from "#core/types/extension-options.type";
import type { SlotHandler } from "#core/types/slot-handler.type";

/** The instance side: one abstract `handle` typed from the slot `S`. */
abstract class ExtensionBase<S extends AnySlot> {
  /** Type-only kind brand, so a class of another kind cannot stand in for an extension. */
  declare readonly "~kind": "extension";

  /**
   * Implements the slot: for an `after` slot, the previous value, the slot's arguments and the context in, the
   * adjusted value out; for a `before` slot, the arguments and the context in, replacement arguments or nothing out.
   */
  abstract handle(...args: Parameters<SlotHandler<S>>): ReturnType<SlotHandler<S>>;
}

/** An extension instance of slot `S`. */
export type Extension<S extends AnySlot = AnySlot> = ExtensionBase<S>;

/** The two forms: bare with the slot as type argument, or called with options. */
type ExtensionKind = (abstract new <S extends AnySlot>() => ExtensionBase<S>) &
  (<S extends AnySlot = never>(
    options: WithPartner<
      S,
      ExtensionOptions,
      'Name the slot as a type argument: Extension<OrderExtensionPoint["adjustTotals"]>({ … })'
    >,
  ) => ExtensionClass<S>);

/** Checks the options of the called form. */
function read(options: ExtensionOptions = {}) {
  if (options.order !== undefined && !Number.isInteger(options.order))
    throw new RangeError(`Extension({ order }) must be a whole number, got ${options.order}`);
  if (options.input !== undefined && typeof options.input !== "function")
    throw new TypeError("Extension({ input }) takes a schema class");
  return { ...options };
}

/**
 * The extension kind base.
 *
 * @example
 * export class RedeemPointsExtension extends Extension<OrderExtensionPoint["adjustTotals"]>({
 *   order: 200,
 *   input: RedeemPointsRequest,
 * }) {
 *   async handle(totals: OrderTotals, draft: OrderDraft, _ctx: ExtensionContext): Promise<OrderTotals> {
 *     return totals;
 *   }
 * }
 */
export const Extension = createKind("extension", ExtensionBase, read) as ExtensionKind;

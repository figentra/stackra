/**
 * Stackra file contract:
 * Purpose: `ExtensionRegistration`, one row gen hands `registerExtensions`: which extension class plugs into which slot
 *          of which point, and its place in the chain.
 * Boundary: a type only. Gen reads the point and the slot from the extension's type argument (`Point["slot"]`), which
 *           is gone at runtime, so this row is how a slot finds its extensions. The instance comes from the connected
 *           resolver; a class whose module is not booted is skipped.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 22 to 25); ADR 0265 (decision 7: the chain is printed).
 */
import type { AnyClass } from "@stackra/container";

import type { Extension } from "#core/bases/extension.base";
import type { ExtensionPoint } from "#core/bases/extension-point.base";

/** One extension of one slot. */
export interface ExtensionRegistration {
  /** The point class that declares the slot. */
  readonly point: AnyClass<ExtensionPoint>;

  /** The slot's property name on the point (`adjustTotals`). */
  readonly slot: string;

  /**
   * The extension class, of any slot. Its slot type argument is gone at runtime, so the row keeps the kind brand and
   * not the `handle` signature (which `Extension<AnySlot>` would erase to `never`).
   */
  readonly extension: AnyClass<Pick<Extension<never>, "~kind">>;

  /** Its place in the chain; the class's `order` option, else `0`, when absent. */
  readonly order?: number;
}

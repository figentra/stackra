/**
 * Stackra file contract:
 * Purpose: `ExtensionOptions`, what the called form `Extension<Point["slot"]>({...})` takes: its place in the slot's
 *          chain and the input it adds to the owning action.
 * Boundary: a type only. Equal `order` values on one slot and two extensions declaring the same `input` namespace are
 *           gen errors; gen merges `input` into the owning action's input schema under the extender's module key.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 25); ADR 0265 (decisions 3 and 5).
 */
import type { AnyClass } from "@stackra/container";

/** The options of an extension. */
export interface ExtensionOptions {
  /** Its place in the slot's chain, ascending; `0` when absent. */
  readonly order?: number;

  /** A schema class gen adds to the owning action's input as `extensions.<module>`. */
  readonly input?: AnyClass;
}

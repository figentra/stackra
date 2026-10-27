/**
 * Stackra file contract:
 * Purpose: `ChangeBase<S>`, the instance side every change shares: the old shape's fields (a `Schema`) and `down`,
 *          which turns a value of the subject's current shape into this older one.
 * Boundary: no options and no state; `Change<Subject>({ from, sunset })` (change.base.ts) is the kind base authors
 *           extend, and its dated form's prototype is this class's. The entry exports it as a type only, so no change
 *           skips its options.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 2, 5, 10 to 13 and 44); ADR 0118 (2026-10-23 note); ADR 0294 (decision 16).
 */
import { Schema } from "@stackra/validation";

/**
 * The instance side every change shares: the old shape's fields and `down`.
 *
 * @example
 * function downOf<S extends object>(change: ChangeBase<S>, subject: S): ChangeBase<S> {
 *   return change.down(subject);
 * }
 */
export abstract class ChangeBase<S extends object> extends Schema {
  /**
   * Turns a value of the subject's current shape into this older one, usually with `X.create({ ... })`.
   *
   * @param subject - the current value.
   * @returns the value in this class's shape.
   */
  abstract down(subject: S): ChangeBase<S>;
}

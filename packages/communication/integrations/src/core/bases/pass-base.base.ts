/**
 * Stackra file contract:
 * Purpose: `PassBase`, the instance side every wallet pass kind shares: the type-only `~kind` brand and the abstract
 *          `content(record)` that turns the owning record into `PassContent`.
 * Boundary: no options and no state; `Pass({ key })` (pass.base.ts) is the kind base authors extend, and its
 *           prototype is this class's. The entry exports it as a type, so a consumer's `extends Pass({ key })` class
 *           has a nameable base in its declaration emit (TS2883, STA-1220).
 * Runtime: isomorphic
 * Governing contract: ADR 0348 (decision 5); ADR 0294 (decision 25); ADR 0305 (rules 10 to 13: one declaration per
 *                     file).
 */
import type { PassContent } from "#core/types/pass-content.type";

/**
 * The instance side every pass kind shares.
 *
 * @example
 * function serialOf(pass: PassBase, record: never): Promise<string> {
 *   return Promise.resolve(pass.content(record)).then((content) => content.serial);
 * }
 */
export abstract class PassBase {
  /** Type-only kind brand. */
  declare readonly "~kind": "pass";

  /** The pass for one owning record; the subclass types `record`. */
  abstract content(record: never): PassContent | Promise<PassContent>;
}

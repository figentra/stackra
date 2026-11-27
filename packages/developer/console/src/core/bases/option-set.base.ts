/**
 * Stackra file contract:
 * Purpose: `OptionSet`, the kind base of a set of options several commands share: a plain class whose `@Option` fields
 *          (with `@Str`, `@Int`, `@Num` or `@List` and their initialisers) a command takes in one field with
 *          `@Options(SomeOptionSet)`. It is never a command and never runs.
 * Boundary: a bare kind base (`registerKind`), with no called form: a set has no options of its own. Its fields are
 *           read by `readCommand` of each command that takes it.
 * Runtime: isomorphic
 * Governing contract: STA-2924 spec FR-001; ADR 0506; ADR 0294 (decision 25).
 */
import { registerKind } from "@stackra/container";

/**
 * The base of a shared option set.
 *
 * @example
 * export class CheckOptionSet extends OptionSet {
 *   @Option({ description: "Apply the fixes the tools can make" })
 *   fix = false;
 * }
 */
export abstract class OptionSet {
  /** Type-only kind brand, so a class of another kind cannot stand in for an option set. */
  declare readonly "~kind": "option_set";
}

registerKind(OptionSet, "option_set");

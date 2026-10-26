/**
 * Stackra file contract:
 * Purpose: `InvalidKitError`, thrown when a kit cannot be read or generated: `kit.json` is not JSON or breaks the
 *          schema, its theme or symbol is unusable, or a store caption has no font. It carries every problem found, so
 *          a kit owner fixes them in one pass.
 * Boundary: the error shape only; the checks live in `parseKit`, `planBrand` and the node readers.
 * Runtime: isomorphic
 * Governing contract: ADR 0232 and ADR 0140 (errors: a category and a snake_case code); ADR 0441 (decision 5).
 */

/** A kit failed its rules; `problems` names each one. */
// shortcut: extends Error until @stackra/errors ships Refusal (ADR 0232, 0294); then
// `extends Refusal({ kind: "validation" })`, and the code is derived from the class name.
export class InvalidKitError extends Error {
  /** The machine code (ADR 0140). */
  readonly code = "invalid_kit";

  /** The error category: the kit is input that failed its rules. */
  readonly category = "validation";

  /** Where the kit was read from (a folder or a file). */
  readonly source: string;

  /** One line per problem. */
  readonly problems: readonly string[];

  // Plain fields, not parameter properties, as in @stackra/tokens' InvalidThemeError.
  constructor(source: string, problems: readonly string[]) {
    super(`${source}: ${problems.join("; ")}`);
    this.name = "InvalidKitError";
    this.source = source;
    this.problems = problems;
  }
}

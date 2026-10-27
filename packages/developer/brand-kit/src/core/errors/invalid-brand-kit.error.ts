/**
 * Stackra file contract:
 * Purpose: `InvalidBrandKitError`, thrown when a run cannot read its kit (no `kit.json`, a `kit.json` that breaks its
 *          rules, an unreadable theme or captions file). It carries every problem found.
 * Boundary: the error shape only; `--check` reports the same problems as issues instead of throwing.
 * Runtime: isomorphic
 * Governing contract: ADR 0232 and ADR 0140 (errors: a category and a snake_case code); ADR 0441 (as amended).
 */

/** A kit could not be read; `problems` names each one. */
// shortcut: extends Error as @stackra/tokens' InvalidThemeError does, until @stackra/errors ships Refusal (ADR 0232);
// then `extends Refusal({ kind: "validation" })`.
export class InvalidBrandKitError extends Error {
  /** The machine code (ADR 0140). */
  readonly code = "invalid_brand_kit";

  /** The error category: the kit is input that failed its rules. */
  readonly category = "validation";

  /** One line per problem. */
  readonly problems: readonly string[];

  constructor(problems: readonly string[]) {
    super(`The brand kit is invalid: ${problems.join("; ")}`);
    this.name = "InvalidBrandKitError";
    this.problems = problems;
  }
}

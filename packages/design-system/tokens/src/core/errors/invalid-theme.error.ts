/**
 * Stackra file contract:
 * Purpose: the error `defineTheme` throws when a theme misses a token or holds a value that cannot render to CSS.
 *          It carries every problem found, so a theme author fixes them in one pass.
 * Boundary: the error shape only; the checks live in define-theme.function.ts.
 * Runtime: isomorphic
 * Governing contract: ADR 0232 and ADR 0140 (errors: a category and a snake_case code); ADR 0302.
 */

/** A theme failed validation; `problems` names each missing or unusable token. */
// shortcut: extends Error until @stackra/errors ships Refusal (ADR 0232, 0294); then
// `extends Refusal({ kind: "validation" })`, and the code is derived from the class name.
export class InvalidThemeError extends Error {
  /** The machine code (ADR 0140). */
  readonly code = "invalid_theme";

  /** The error category: the theme is input that failed its rules. */
  readonly category = "validation";

  constructor(
    /** The theme's name as given, or an empty string when it had none. */
    readonly themeName: string,
    /** One line per problem, each naming the token path. */
    readonly problems: readonly string[],
  ) {
    super(`Theme "${themeName}" is invalid: ${problems.join("; ")}`);
    this.name = "InvalidThemeError";
  }
}

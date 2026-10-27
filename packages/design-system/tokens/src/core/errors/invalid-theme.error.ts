/**
 * Stackra file contract:
 * Purpose: the error `defineTheme` throws when a theme misses a token or holds a value that cannot render to CSS.
 *          It carries every problem found, so a theme author fixes them in one pass.
 * Boundary: the error shape only; the checks live in define-theme.function.ts. A validation refusal: its code
 *           (`invalid_theme`) is derived from the class name and its details are `themeName` and `problems`; build it
 *           with `InvalidThemeError.create({ themeName, problems })`, never `new`.
 * Runtime: isomorphic
 * Governing contract: ADR 0232 and ADR 0140 (errors: a category and a snake_case code); ADR 0294 (decision 25);
 *                     ADR 0305 (rule 2); ADR 0302.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * A theme failed validation; `problems` names each missing or unusable token.
 *
 * @example
 * throw InvalidThemeError.create({ themeName: "acme", problems: ["colors.accent is missing"] });
 */
export class InvalidThemeError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The theme's name as given, or an empty string when it had none. */
  themeName!: string;

  /** One line per problem, each naming the token path. */
  problems!: readonly string[];
}

/**
 * Stackra file contract:
 * Purpose: `shellCommandLine(argv)`, one POSIX `sh` line that runs `argv` exactly, every literal part single-quoted,
 *          with each `$NAME` reference left for the shell to expand from its environment and failing, naming the
 *          variable, when it is unset or empty.
 * Boundary: builds a string; never runs it and never sees a value. Nothing but a `$NAME` reference is expanded, so an
 *           argument cannot inject shell syntax.
 * Runtime: isomorphic
 * Governing contract: ADR 0173 (values exist only inside the launched process); ADR 0282 (decision 3).
 */
import { SECRET_REFERENCE } from "#core/constants/secret-reference.constant";

/** `value` single-quoted for `sh`. */
const quoted = (value: string): string => `'${value.replaceAll("'", `'\\''`)}'`;

/**
 * The `sh -c` line for `argv`.
 *
 * @param argv - the program and its arguments, which may hold `$NAME` references.
 * @example
 * shellCommandLine(["npx", "--api-key", "$CONTEXT7_API_KEY"]);
 * // 'npx' '--api-key' "${CONTEXT7_API_KEY:?CONTEXT7_API_KEY is not set in the secret store}"
 */
export function shellCommandLine(argv: readonly string[]): string {
  return argv
    .map((argument) => {
      if (argument === "") return "''";
      // split with a capture group alternates literal text and the captured name.
      return argument
        .split(SECRET_REFERENCE)
        .map((part, index) =>
          index % 2 === 1
            ? `"\${${part}:?${part} is not set in the secret store}"`
            : part && quoted(part),
        )
        .join("");
    })
    .join(" ");
}

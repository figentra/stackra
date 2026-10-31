/**
 * Stackra file contract:
 * Purpose: `splitInvocation(argv)`, the command name (the first positional token before `--`) and the other tokens,
 *          with `-n` spelt out as `--no-interaction`.
 * Boundary: pure. Only global options, which are all flags, may come before the name.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-009 and FR-015.
 */

/** The name and the remaining tokens of `argv`. */
export function splitInvocation(argv: readonly string[]): {
  name: string | undefined;
  rest: string[];
} {
  const rest: string[] = [];
  let name: string | undefined;
  let afterDash = false;
  for (const token of argv) {
    if (afterDash) rest.push(token);
    else if (token === "--") {
      afterDash = true;
      rest.push(token);
    } else if (name === undefined && !token.startsWith("-")) name = token;
    else rest.push(token === "-n" ? "--no-interaction" : token);
  }
  return { name, rest };
}

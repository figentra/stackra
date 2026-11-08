/**
 * Stackra file contract:
 * Purpose: `splitInvocation(argv, known, valueFlag)`, the command name and the other tokens, with `-n` spelt out as
 *          `--no-interaction`. The name is the first positional token before `--`, joined with the words after it
 *          into the longest `a:b` name that `known` accepts, so `mcp sync` runs `mcp:sync`; `raw` keeps the other
 *          tokens exactly as given.
 * Boundary: pure. Before the name come global options (all flags) and options for which `valueFlag` is true, each of
 *           which takes the next token as its value (`--box 2 ssh`); `--box=2` is one token either way.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-009 and FR-015; STA-1966 spec FR-012; ADR 0506 (amendment 2026-11-03).
 */

/** The name and the remaining tokens of `argv`. */
export function splitInvocation(
  argv: readonly string[],
  known: (name: string) => boolean = () => false,
  valueFlag: (token: string) => boolean = () => false,
): {
  name: string | undefined;
  rest: string[];
  raw: string[];
} {
  const rest: string[] = [];
  // The tokens as given, for a passthrough command that reads its own flags (`-n` may be its own).
  const raw: string[] = [];
  let name: string | undefined;
  let afterDash = false;
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index] ?? "";
    if (afterDash) {
      rest.push(token);
      raw.push(token);
    } else if (token === "--") {
      afterDash = true;
      rest.push(token);
      raw.push(token);
    } else if (
      name === undefined &&
      !token.includes("=") &&
      valueFlag(token) &&
      index + 1 < argv.length
    ) {
      index += 1;
      rest.push(token, argv[index] ?? "");
      raw.push(token, argv[index] ?? "");
    } else if (name === undefined && !token.startsWith("-")) {
      let words = 1;
      while (index + words < argv.length && !(argv[index + words] ?? "-").startsWith("-"))
        words += 1;
      for (let count = words; count >= 1; count -= 1) {
        const joined = argv.slice(index, index + count).join(":");
        if (count === 1 || known(joined)) {
          name = joined;
          index += count - 1;
          break;
        }
      }
    } else {
      rest.push(token === "-n" ? "--no-interaction" : token);
      raw.push(token);
    }
  }
  return { name, rest, raw };
}

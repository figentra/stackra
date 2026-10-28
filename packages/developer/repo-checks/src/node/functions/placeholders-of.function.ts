/**
 * Stackra file contract:
 * Purpose: `placeholdersOf(message)`, the argument names an ICU message uses (`{name}`, `{count, plural, ...}`, nested ones
 *          inside options), sorted. Quoted text and the plural `#` are not arguments.
 * Boundary: pure; a message that does not parse gives null, never a throw.
 * Runtime: node
 * Governing contract: ADR 0403 (placeholders match the English source).
 */

/** The ICU argument types whose options are sub-messages. */
const OPTION_TYPES = new Set(["plural", "select", "selectordinal"]);

/** Ends the parse: the message is not balanced ICU. */
const fail = (): never => {
  throw new SyntaxError("unbalanced ICU message");
};

/**
 * The sorted argument names of `message`, or null when it is not a valid ICU message.
 *
 * @param message - an ICU MessageFormat string.
 * @example
 * placeholdersOf("{count, plural, one {# item for {name}} other {# items}}"); // ["count", "name"]
 */
export function placeholdersOf(message: string): string[] | null {
  const names = new Set<string>();
  let at = 0;
  const skipSpace = (): void => {
    while (at < message.length && /\s/.test(message[at] ?? "")) at += 1;
  };
  /** Reads one argument after its `{`, through its `}`. */
  const argument = (): void => {
    const nameEnd = message.slice(at).search(/[,}]/);
    if (nameEnd === -1) fail();
    names.add(message.slice(at, at + nameEnd).trim());
    at += nameEnd;
    if (message[at] === "}") {
      at += 1;
      return;
    }
    at += 1;
    const typeEnd = message.slice(at).search(/[,}]/);
    if (typeEnd === -1) fail();
    const type = message.slice(at, at + typeEnd).trim();
    at += typeEnd;
    if (!OPTION_TYPES.has(type)) {
      // A number, date or time argument: its style may hold braces of its own.
      let depth = 1;
      while (at < message.length && depth > 0) {
        if (message[at] === "{") depth += 1;
        else if (message[at] === "}") depth -= 1;
        at += 1;
      }
      if (depth > 0) fail();
      return;
    }
    if (message[at] !== ",") fail();
    at += 1;
    for (;;) {
      skipSpace();
      if (message[at] === "}") {
        at += 1;
        return;
      }
      const selectorEnd = message.slice(at).search(/[\s{]/);
      if (selectorEnd <= 0) fail();
      const selector = message.slice(at, at + selectorEnd);
      at += selectorEnd;
      if (selector.startsWith("offset:")) continue;
      skipSpace();
      if (message[at] !== "{") fail();
      at += 1;
      body();
      if (message[at] !== "}") fail();
      at += 1;
    }
  };
  /** Reads a message until an unmatched `}` (left unread) or the end. */
  const body = (): void => {
    while (at < message.length) {
      const char = message[at];
      if (char === "'") {
        const next = message[at + 1];
        if (next === "'") at += 2;
        else if (next === "{" || next === "}" || next === "#" || next === "|") {
          const close = message.indexOf("'", at + 1);
          at = close === -1 ? message.length : close + 1;
        } else at += 1;
      } else if (char === "{") {
        at += 1;
        argument();
      } else if (char === "}") return;
      else at += 1;
    }
  };
  try {
    body();
    if (at < message.length) fail();
  } catch {
    return null;
  }
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  return [...names].sort();
}

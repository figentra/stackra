/**
 * Stackra file contract:
 * Purpose: `staticLiteral`, the value of the static literal that opens `text`: the argument of a `define*` call, read
 *          without running `stackra.config.ts`. Objects, arrays, strings, numbers, `true`, `false` and `null` become
 *          their JSON value; a reference (`Target.Ios`, `MobileEnvConfig`) becomes its source text.
 * Boundary: pure. Comments and trailing commas are allowed. A spread, a call, a shorthand property, a computed key or
 *           a template with `${` is not static data and throws, so the caller refuses it.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decision 1: the argument is static data gen reads without running it).
 */

/** A reference: an identifier with its dotted members. */
const REFERENCE = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*/;

/** A number literal. */
const NUMBER = /^-?(?:\d[\d_]*)(?:\.\d+)?(?:e[+-]?\d+)?/i;

/**
 * The static value at the start of `text`, and where it ends.
 *
 * @param text - the source, starting at (or before blanks and comments ahead of) the literal.
 * @throws Error when the literal is not static data.
 * @example
 * staticLiteral('{ ios: { bundleId: "com.acme.app" }, targets: [Target.Ios], }').value;
 * // { ios: { bundleId: "com.acme.app" }, targets: ["Target.Ios"] }
 */
export function staticLiteral(text: string): { readonly value: unknown; readonly end: number } {
  let at = 0;
  const skip = (): void => {
    for (;;) {
      const rest = text.slice(at);
      const blank = /^(?:\s+|\/\/[^\n]*|\/\*[\s\S]*?\*\/)/.exec(rest);
      if (blank === null) return;
      at += blank[0].length;
    }
  };
  const fail = (what: string): never => {
    throw new Error(`not static data at offset ${at}: ${what}`);
  };
  const string = (): string => {
    const quote = text[at] ?? "";
    let out = "";
    at++;
    while (at < text.length && text[at] !== quote) {
      if (quote === "`" && text.startsWith("${", at)) fail("a template with ${");
      if (text[at] === "\\") {
        const next = text[at + 1] ?? "";
        out += next === "n" ? "\n" : next === "t" ? "\t" : next;
        at += 2;
      } else out += text[at++];
    }
    if (at >= text.length) fail("an unterminated string");
    at++;
    return out;
  };
  const value = (): unknown => {
    skip();
    const head = text[at];
    if (head === "{") {
      at++;
      const object: Record<string, unknown> = {};
      for (;;) {
        skip();
        if (text[at] === "}") break;
        if (text.startsWith("...", at)) fail("a spread");
        if (text[at] === "[") fail("a computed key");
        let key: string;
        if (text[at] === '"' || text[at] === "'") key = string();
        else {
          const name = /^[\w$]+/.exec(text.slice(at))?.[0] ?? fail("a key");
          key = name;
          at += name.length;
        }
        skip();
        if (text[at] !== ":") fail(`a shorthand or method property \`${key}\``);
        at++;
        object[key] = value();
        skip();
        if (text[at] === ",") at++;
        else if (text[at] !== "}") fail("a missing comma");
      }
      at++;
      return object;
    }
    if (head === "[") {
      at++;
      const array: unknown[] = [];
      for (;;) {
        skip();
        if (text[at] === "]") break;
        if (text.startsWith("...", at)) fail("a spread");
        array.push(value());
        skip();
        if (text[at] === ",") at++;
        else if (text[at] !== "]") fail("a missing comma");
      }
      at++;
      return array;
    }
    if (head === '"' || head === "'" || head === "`") return string();
    const rest = text.slice(at);
    const number = NUMBER.exec(rest)?.[0];
    if (number !== undefined) {
      at += number.length;
      return Number(number.replaceAll("_", ""));
    }
    const reference = REFERENCE.exec(rest)?.[0] ?? fail("an expression");
    at += reference.length;
    skip();
    if (text[at] === "(") fail(`a call of ${reference}`);
    return reference === "true"
      ? true
      : reference === "false"
        ? false
        : reference === "null"
          ? null
          : reference;
  };
  const result = value();
  return { value: result, end: at };
}

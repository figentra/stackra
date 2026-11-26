/**
 * Stackra file contract:
 * Purpose: `maskCode(source)`, the source of a JavaScript or TypeScript file with the inside of every comment, string,
 *          template text and regular-expression literal turned into spaces (newlines kept), so a pattern run over it
 *          matches code only: `it.skip(` inside a fixture string or a comment is not a marker. Quotes, backticks,
 *          slashes and `${ … }` code stay, and every character keeps its offset, so a match can be read back from the
 *          original text.
 * Boundary: pure; a lexer for these four token kinds, not a parser. A `/` is a regular expression when the code before
 *           it ends in an operator, an opening bracket, a comma or a keyword such as `return`; otherwise it divides.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4); STA-2842.
 */

/** Keywords after which a `/` starts a regular expression. */
const REGEX_AFTER_WORD = new Set([
  "return",
  "typeof",
  "instanceof",
  "case",
  "do",
  "else",
  "in",
  "of",
  "new",
  "delete",
  "void",
  "throw",
  "yield",
  "await",
]);

/** Whether a `/` at `index` of the original text starts a regular expression. */
function startsRegex(source: string, index: number): boolean {
  let at = index - 1;
  while (at >= 0 && /\s/.test(source[at] ?? "")) at -= 1;
  if (at < 0) return true;
  const previous = source[at] ?? "";
  if ("(,=:[!&|?{};+-*%<>~^".includes(previous)) return true;
  if (!/[\w$]/.test(previous)) return false;
  let start = at;
  while (start > 0 && /[\w$]/.test(source[start - 1] ?? "")) start -= 1;
  return REGEX_AFTER_WORD.has(source.slice(start, at + 1));
}

/** The text of `source` with comment, string, template-text and regex contents blanked (newlines kept). */
export function maskCode(source: string): string {
  // UTF-16 units, not code points, so an offset here is an offset in `source`.
  const out = source.split("");
  const blank = (at: number): void => {
    if (out[at] !== "\n") out[at] = " ";
  };
  /** One frame per template literal open, holding the brace depth of the `${ … }` code it is in, or -1 in its text. */
  const templates: number[] = [];
  let index = 0;
  while (index < source.length) {
    const char = source[index] ?? "";
    const next = source[index + 1] ?? "";
    const top = templates.length - 1;
    if (top >= 0 && templates[top] === -1) {
      // Template text: blank up to the closing backtick or the next `${`.
      if (char === "\\") {
        blank(index);
        blank(index + 1);
        index += 2;
      } else if (char === "`") {
        templates.pop();
        index += 1;
      } else if (char === "$" && next === "{") {
        templates[top] = 0;
        index += 2;
      } else {
        blank(index);
        index += 1;
      }
      continue;
    }
    if (char === "/" && next === "/") {
      while (index < source.length && source[index] !== "\n") blank(index++);
    } else if (char === "/" && next === "*") {
      const end = source.indexOf("*/", index + 2);
      const stop = end === -1 ? source.length : end + 2;
      while (index < stop) blank(index++);
    } else if (char === '"' || char === "'") {
      index += 1;
      while (index < source.length && source[index] !== char && source[index] !== "\n") {
        if (source[index] === "\\") blank(index++);
        blank(index++);
      }
      index += 1;
    } else if (char === "`") {
      templates.push(-1);
      index += 1;
    } else if (char === "/" && startsRegex(source, index)) {
      index += 1;
      let inClass = false;
      while (index < source.length && source[index] !== "\n") {
        const current = source[index];
        if (current === "\\") {
          blank(index++);
        } else if (current === "[") {
          inClass = true;
        } else if (current === "]") {
          inClass = false;
        } else if (current === "/" && !inClass) {
          break;
        }
        blank(index++);
      }
      index += 1;
    } else {
      if (top >= 0) {
        const depth = templates[top] ?? 0;
        if (char === "{") templates[top] = depth + 1;
        else if (char === "}") templates[top] = depth === 0 ? -1 : depth - 1;
      }
      index += 1;
    }
  }
  return out.join("");
}

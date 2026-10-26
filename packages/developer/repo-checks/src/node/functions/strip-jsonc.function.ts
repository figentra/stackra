/**
 * Stackra file contract:
 * Purpose: `stripJsonc(text)`, JSONC to JSON text: drops // and /* *\/ comments outside strings, then trailing commas. Node has
 *          no JSONC API, so the repository checks carry this one.
 * Boundary: pure; an unterminated block comment throws.
 * Runtime: node
 * Governing contract: the JSON vs JSONC rule (STA-299).
 */

/**
 * The JSON text of a JSONC document.
 *
 * @param text - JSONC source.
 * @throws Error when a block comment never closes.
 * @example
 * JSON.parse(stripJsonc('{ "a": 1, // note\n }')); // { a: 1 }
 */
export function stripJsonc(text: string): string {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      const start = i;
      for (i++; i < text.length && text[i] !== '"'; i++) if (text[i] === "\\") i++;
      out += text.slice(start, i + 1);
    } else if (c === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      out += "\n";
    } else if (c === "/" && text[i + 1] === "*") {
      i = text.indexOf("*/", i + 2);
      if (i === -1) throw new Error("unterminated /* comment");
      i++;
    } else out += c;
  }
  return out.replace(/,(\s*[}\]])/g, "$1");
}

/**
 * Stackra file contract:
 * Purpose: `enumCodesOf`, the codes of `export const <Name> = Enum.of({ ... })` read from a source file's text, in
 *          declaration order: each top-level property's string value, or the first item of its `[code, meta]` pair.
 *          For an enum a declared package exports from an entry gen has not written yet, when the package commits
 *          no manifest either (STA-1663).
 * Boundary: pure; a small scanner over the object literal (strings, comments and nesting), not a TypeScript parse.
 *           Undefined when the file declares no such enum.
 * Runtime: isomorphic
 * Governing contract: ADR 0128 (enums are `Enum.of`); STA-1663.
 */

/**
 * The codes of the enum `name` declared in `text`.
 *
 * @param text - a source file's text.
 * @param name - the enum's exported name.
 * @example
 * enumCodesOf('export const Mode = Enum.of({ Live: "live", Test: ["test", { label: "x" }] });', "Mode"); // ["live", "test"]
 */
export function enumCodesOf(text: string, name: string): string[] | undefined {
  const start = new RegExp(`export\\s+const\\s+${name}\\s*=\\s*Enum\\.of\\(\\s*\\{`).exec(text);
  if (start === null) return undefined;
  const codes: string[] = [];
  let depth = 1;
  // After a top-level `key:`, the next string at the top level or first inside `[`, is that case's code.
  let expecting = false;
  for (let index = start.index + start[0].length; index < text.length && depth > 0; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === "/" && next === "/") {
      const end = text.indexOf("\n", index);
      index = end === -1 ? text.length : end;
    } else if (char === "/" && next === "*") {
      const end = text.indexOf("*/", index + 2);
      index = end === -1 ? text.length : end + 1;
    } else if (char === '"' || char === "'" || char === "`") {
      let end = index + 1;
      while (end < text.length && text[end] !== char) end += text[end] === "\\" ? 2 : 1;
      if (expecting && depth <= 2) {
        codes.push(text.slice(index + 1, end));
        expecting = false;
      }
      index = end;
    } else if (char === "{" || char === "(") {
      depth += 1;
      expecting = false;
    } else if (char === "[") depth += 1;
    else if (char === "}" || char === "]" || char === ")") depth -= 1;
    else if (char === ":" && depth === 1) expecting = true;
    else if (char === "," && depth === 1) expecting = false;
  }
  return codes;
}

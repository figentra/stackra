/**
 * Stackra file contract:
 * Purpose: `appendMembers(text, lines, at)`, a class file with `lines` added at the end of its class body (or, with
 *          `at: "start"`, at its start, where decorated fields go by the member order), a blank line between them and
 *          the members already there, so a scaffold can add a permission static or a model field to a file someone
 *          already wrote.
 * Boundary: pure; the class is the file's last `}`, as one declaration per file leaves it. An empty body written
 *           `{}` on the class line is opened.
 * Runtime: node
 * Governing contract: ADR 0305 (one declaration per file); ADR 0128 (member order).
 */

/**
 * `text` with `lines` appended to its class body.
 *
 * @param text - the file.
 * @param lines - the member lines, already indented.
 * @param at - the end of the body (default) or its start.
 * @example
 * appendMembers("class A {}\n", ["  b = 1;"]); // "class A {\n  b = 1;\n}\n"
 */
export function appendMembers(
  text: string,
  lines: readonly string[],
  at: "start" | "end" = "end",
): string {
  if (lines.length === 0) return text;
  const declaration = text.indexOf("export class");
  const open = text.indexOf("{", declaration);
  const empty = /^\{\s*\}/.test(text.slice(open));
  if (at === "start" && !empty) {
    const lineEnd = text.indexOf("\n", open);
    return `${text.slice(0, lineEnd + 1)}${lines.join("\n")}\n\n${text.slice(lineEnd + 1)}`;
  }
  const close = text.lastIndexOf("}");
  const head = text.slice(0, close).replace(/\s*$/, "");
  const tail = text.slice(close);
  return head.endsWith("{")
    ? `${head}\n${lines.join("\n")}\n${tail}`
    : `${head}\n\n${lines.join("\n")}\n${tail}`;
}

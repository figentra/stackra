/**
 * Stackra file contract:
 * Purpose: `formatJson(value)`, JSON laid out the way the repository's formatter (oxfmt, Prettier's JSON layout at 100
 *          columns) leaves it, so a file `stackra encore:prepare` writes passes the format check unchanged: two-space
 *          indent, every object expanded, an array of scalars on one line when the whole line fits in 100 columns,
 *          otherwise one item per line, and a final newline.
 * Boundary: pure. For the small config files prepare writes (package.json, tsconfig.json); it does not reproduce every
 *           formatter rule (no long strings are wrapped, an array that holds an object is always expanded).
 * Runtime: node
 * Governing contract: ADR 0091 (decision 2, amendment of 2026-11-09).
 */

/** The formatter's print width. */
const WIDTH = 100;

/** Whether `value` prints on one line as itself. */
const isScalar = (value: unknown): boolean => value === null || typeof value !== "object";

/** `value` printed at `depth`, whose line starts with `lead` (the indent and any `"key": `). */
function print(value: unknown, depth: number, lead: string, tail: string): string {
  const indent = "  ".repeat(depth);
  const inner = "  ".repeat(depth + 1);
  if (isScalar(value)) return JSON.stringify(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    if (value.every(isScalar)) {
      const inline = `[${value.map((item) => JSON.stringify(item)).join(", ")}]`;
      if (lead.length + inline.length + tail.length <= WIDTH) return inline;
    }
    const items = value.map(
      (item, index) =>
        `${inner}${print(item, depth + 1, inner, index < value.length - 1 ? "," : "")}`,
    );
    return `[\n${items.join(",\n")}\n${indent}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return "{}";
  const lines = entries.map(([key, item], index) => {
    const head = `${inner}${JSON.stringify(key)}: `;
    return `${head}${print(item, depth + 1, head, index < entries.length - 1 ? "," : "")}`;
  });
  return `{\n${lines.join(",\n")}\n${indent}}`;
}

/**
 * `value` as formatted JSON text, with a final newline.
 *
 * @example
 * formatJson({ compilerOptions: { paths: { "#src/*": ["./src/*", "./src/*.ts"] } } });
 * // '{\n  "compilerOptions": {\n    "paths": {\n      "#src/*": ["./src/*", "./src/*.ts"]\n    }\n  }\n}\n'
 */
export function formatJson(value: unknown): string {
  return `${print(value, 0, "", "")}\n`;
}

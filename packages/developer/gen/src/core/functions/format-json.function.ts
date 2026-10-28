/**
 * Stackra file contract:
 * Purpose: `formatJson`, JSON as gen commits it, byte for byte in the repository formatter's shape (oxfmt, the JSON
 *          printer Prettier also has): two-space indent, a final newline, every non-empty object one key per line,
 *          and an array on one line when it fits the 100-column print width, so `oxfmt --check` passes on the
 *          committed manifests, OpenAPI documents and graphs without a format step (stackra-247).
 * Boundary: pure. Key order is the value's own (the formatter never sorts keys). An array breaks when it holds a
 *           non-empty object, when it holds two or more arrays of two or more items each, or when it does not fit;
 *           a broken array of numbers packs as many per line as fit, as the formatter's fill does. Width is counted
 *           in UTF-16 code units; shortcut: a wide (CJK, emoji) character counts 1 where the formatter counts 2, so
 *           an array of such strings near the edge can differ; count display width if one ever reaches a manifest.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 10: the committed manifest); .oxfmtrc.jsonc (`printWidth` 100).
 */

/** The formatter's `printWidth` (.oxfmtrc.jsonc). */
const WIDTH = 100;

/** Whether `value` is a JSON object (not an array, not null). */
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Whether the formatter breaks `items` regardless of width: two or more arrays of two or more items each. */
const forcedBreak = (items: readonly unknown[]): boolean =>
  items.length > 1 && items.every((item) => Array.isArray(item) && item.length > 1);

/** `value` on one line, or undefined when the formatter would never print it flat. */
function flat(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    if (forcedBreak(value)) return undefined;
    const items = value.map(flat);
    return items.every((item) => item !== undefined) ? `[${items.join(", ")}]` : undefined;
  }
  if (isObject(value)) return Object.keys(value).length === 0 ? "{}" : undefined;
  return JSON.stringify(value);
}

/**
 * `value` printed at `indent`, where `start` columns of its first line are already taken and `tail` columns (a
 * comma) follow it.
 */
function print(value: unknown, indent: number, start: number, tail: number): string {
  const line = flat(value);
  if (line !== undefined && (start + line.length + tail <= WIDTH || typeof value !== "object"))
    return line;
  const pad = " ".repeat(indent + 2);
  const close = " ".repeat(indent);
  if (Array.isArray(value)) {
    if (value.length > 1 && value.every((item) => typeof item === "number")) {
      const rows: string[] = [];
      let row = "";
      for (const number of value.map((item) => JSON.stringify(item))) {
        if (row === "") row = `${pad}${number}`;
        else if (row.length + 2 + number.length <= WIDTH) row = `${row}, ${number}`;
        else {
          rows.push(`${row},`);
          row = `${pad}${number}`;
        }
      }
      return `[\n${[...rows, row].join("\n")}\n${close}]`;
    }
    const items = value.map(
      (item, index) =>
        `${pad}${print(item, indent + 2, indent + 2, index < value.length - 1 ? 1 : 0)}`,
    );
    return `[\n${items.join(",\n")}\n${close}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>);
  const lines = entries.map(([key, item], index) => {
    const label = `${JSON.stringify(key)}: `;
    const comma = index < entries.length - 1 ? 1 : 0;
    return `${pad}${label}${print(item, indent + 2, indent + 2 + label.length, comma)}`;
  });
  return `{\n${lines.join(",\n")}\n${close}}`;
}

/**
 * `value` as the formatter prints it, with a final newline.
 *
 * @param value - any JSON-serialisable value; what `JSON.stringify` drops (undefined, functions) is dropped here too.
 * @example
 * formatJson({ runtimes: ["node", "browser"] });
 * // '{\n  "runtimes": ["node", "browser"]\n}\n'
 */
export function formatJson(value: unknown): string {
  // oxlint-disable-next-line unicorn/prefer-structured-clone -- the round trip drops undefined and functions as JSON.stringify does; structuredClone throws on functions
  return `${print(JSON.parse(JSON.stringify(value)) as unknown, 0, 0, 0)}\n`;
}

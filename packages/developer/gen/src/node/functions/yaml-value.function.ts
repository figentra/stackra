/**
 * Stackra file contract:
 * Purpose: `yamlValue`, a block-style YAML document as plain data (mappings, sequences, string scalars): enough for gen
 *          to read the values of a runway file's `events` block (key lists, subscriber lists) without a YAML dependency.
 * Boundary: pure. Block style only, as repo-owned YAML is (`checkYamlFlowMaps`): a flow sequence is read only as a
 *           one-line list of scalars, and `{}` is an empty mapping. Every scalar stays a string (quotes removed).
 *           shortcut: no anchors, block scalars, escapes or multi-line keys; switch to `readRunway` from
 *           `@stackra/runway` once gen depends on it (an integration-batch lockfile change).
 * Runtime: node
 * Governing contract: ADR 0296 (runway v3); ADR 0511 (amendment of 2026-11-02: the `events` block); STA-1910.
 */

/** One meaningful line: its indent and its text without the comment. */
interface Line {
  readonly indent: number;
  readonly text: string;
}

/** A mapping key line: the key and the value on the same line (empty when the value is a nested block). */
const KEY_LINE = /^("[^"]*"|'[^']*'|[^\s"'#:-][^:#]*?):(?:\s+(.*?))?\s*$/;

/** Whether `text` is a sequence item (`- x` or a bare `-`). */
const isItem = (text: string): boolean => text === "-" || text.startsWith("- ");

/** A scalar without its quotes; `[a, b]` a list of scalars, `{}` an empty mapping. */
function scalar(text: string): unknown {
  if (text === "{}") return {};
  if (text.startsWith("[") && text.endsWith("]")) {
    const inner = text.slice(1, -1).trim();
    return inner === "" ? [] : inner.split(",").map((part) => scalar(part.trim()));
  }
  return text.replace(/^(["'])(.*)\1$/, "$2");
}

/** The block that starts at `cursor.at`, whose lines sit at `indent`. */
function block(lines: Line[], cursor: { at: number }, indent: number): unknown {
  const first = lines[cursor.at];
  if (first === undefined || first.indent !== indent) return undefined;
  if (isItem(first.text)) {
    const items: unknown[] = [];
    for (let line = lines[cursor.at]; line?.indent === indent && isItem(line.text);) {
      const rest = line.text.slice(1).trimStart();
      if (rest === "") {
        cursor.at += 1;
        const next = lines[cursor.at];
        items.push(
          next !== undefined && next.indent > indent ? block(lines, cursor, next.indent) : null,
        );
      } else {
        // `- key: value` opens a mapping whose further keys sit under the item's text.
        const at = indent + line.text.length - rest.length;
        lines[cursor.at] = { indent: at, text: rest };
        items.push(block(lines, cursor, at));
      }
      line = lines[cursor.at];
    }
    return items;
  }
  const match = KEY_LINE.exec(first.text);
  if (match === null) {
    cursor.at += 1;
    return scalar(first.text);
  }
  const map: Record<string, unknown> = {};
  for (let line = lines[cursor.at]; line?.indent === indent && !isItem(line.text);) {
    const [, key = "", value = ""] = KEY_LINE.exec(line.text) ?? [];
    cursor.at += 1;
    const next = lines[cursor.at];
    map[key.replace(/^(["'])(.*)\1$/, "$2")] =
      value !== ""
        ? scalar(value)
        : next !== undefined &&
            (next.indent > indent || (next.indent === indent && isItem(next.text)))
          ? block(lines, cursor, next.indent)
          : null;
    line = lines[cursor.at];
  }
  return map;
}

/**
 * The plain data of `source`.
 *
 * @example
 * yamlValue("keys:\n  - id: pay-dev-1\n    publicKey: abc\n"); // { keys: [{ id: "pay-dev-1", publicKey: "abc" }] }
 */
export function yamlValue(source: string): unknown {
  const lines: Line[] = [];
  for (const raw of source.split(/\r?\n/)) {
    const line = raw.replace(/(^|\s)#.*$/, "");
    if (line.trim() === "" || line.trim() === "---") continue;
    lines.push({ indent: line.length - line.trimStart().length, text: line.trim() });
  }
  return block(lines, { at: 0 }, lines[0]?.indent ?? 0);
}

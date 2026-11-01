/**
 * Stackra file contract:
 * Purpose: `yamlKeyTree`, the mapping keys of a block-style YAML document as a tree, values left out: enough for gen
 *          to ask which keys a runway file names (`environments.<env>.queues.<name>`) without a YAML dependency.
 * Boundary: pure. Block style only, as repo-owned YAML is (`checkYamlFlowMaps`): a flow map (`{}`) has no keys here,
 *           list items are skipped, and the lines of a block scalar (`|`, `>`) are not read as keys. shortcut: no
 *           anchors or multi-line keys; switch to `readRunway` from `@stackra/runway` once gen depends on it (an
 *           integration-batch lockfile change).
 * Runtime: node
 * Governing contract: ADR 0296 (runway v3); STA-1727.
 */
import type { YamlKeyTree } from "#node/types/yaml-key-tree.type";

/** A mapping key line: its indent, key and the value on the same line. */
const KEY_LINE = /^( *)("[^"]*"|'[^']*'|[^\s"'#:-][^:#]*?):(?:\s+(.*?))?\s*$/;

/** A block scalar's indicator (`|`, `>-`, `|2+`). */
const BLOCK_SCALAR = /^[|>][0-9+-]*$/;

/**
 * The key tree of `source`.
 *
 * @example
 * yamlKeyTree("environments:\n  prod:\n    queues:\n      billing:\n").get("environments")?.get("prod");
 */
export function yamlKeyTree(source: string): YamlKeyTree {
  const root = new Map<string, YamlKeyTree>();
  const stack: { readonly indent: number; readonly node: Map<string, YamlKeyTree> }[] = [
    { indent: -1, node: root },
  ];
  let scalarIndent: number | undefined;
  for (const raw of source.split(/\r?\n/)) {
    const line = raw.replace(/(^|\s)#.*$/, "");
    if (line.trim() === "") continue;
    const indent = line.length - line.trimStart().length;
    if (scalarIndent !== undefined && indent > scalarIndent) continue;
    scalarIndent = undefined;
    const match = KEY_LINE.exec(line);
    if (match === null) continue;
    const [, , key = "", value = ""] = match;
    while ((stack.at(-1)?.indent ?? -1) >= indent) stack.pop();
    const child = new Map<string, YamlKeyTree>();
    stack.at(-1)?.node.set(key.replace(/^(["'])(.*)\1$/, "$2"), child);
    stack.push({ indent, node: child });
    if (BLOCK_SCALAR.test(value)) scalarIndent = indent;
  }
  return root;
}

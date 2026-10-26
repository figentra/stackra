/**
 * Stackra file contract:
 * Purpose: `checkYamlFlowMaps(path, text)`, the YAML standard (STA-299): repo-owned YAML has no flow mappings; flow sequences
 *          of plain scalars and the empty `{}` stay allowed.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: the YAML standard (STA-299).
 */
import { LineCounter, parseDocument, visit } from "yaml";

/**
 * The flow-mapping findings of one YAML file, each with its line.
 *
 * @param path - repository-relative, used in the findings.
 * @param text - the file's contents.
 * @example
 * checkYamlFlowMaps("a.yaml", "a: { b: 1 }\n"); // ["a.yaml:1: flow mapping; …"]
 */
export function checkYamlFlowMaps(path: string, text: string): string[] {
  const lineCounter = new LineCounter();
  const doc = parseDocument(text, { lineCounter });
  const [error] = doc.errors;
  if (error) return [`${path}: not valid YAML (${error.message.split("\n")[0]})`];
  const out: string[] = [];
  visit(doc, {
    Map(_, node) {
      if (!node.flow || node.items.length === 0) return;
      const { line } = lineCounter.linePos(node.range?.[0] ?? 0);
      out.push(`${path}:${line}: flow mapping; write a block mapping (YAML standard, STA-299)`);
    },
  });
  return out;
}

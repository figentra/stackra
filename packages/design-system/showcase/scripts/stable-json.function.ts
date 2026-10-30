/**
 * Stackra file contract:
 * Purpose: `stableJson`, JSON with sorted object keys and 2-space indent (gen.ts then runs it through oxfmt).
 * Boundary: a pure function.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.2.
 */

function sortKeys(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(sortKeys);
  if (!node || typeof node !== "object") return node;
  return Object.fromEntries(
    Object.keys(node)
      .toSorted()
      .map((key) => [key, sortKeys((node as Record<string, unknown>)[key])]),
  );
}

/** `value` as stable JSON text with a trailing newline. */
export function stableJson(value: unknown): string {
  return `${JSON.stringify(sortKeys(value), null, 2)}\n`;
}

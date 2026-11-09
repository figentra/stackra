/**
 * Stackra file contract:
 * Purpose: `valueImportsOf(source)`, the module specifiers a source file statically imports or re-exports a VALUE from:
 *          `import … from "<spec>"` and `export … from "<spec>"`, leaving out `import type`, `export type` and a clause
 *          whose every named item is `type X`. A dynamic `import("<spec>")` is not a static import, so it is not listed.
 * Boundary: pure; a text scan of one file, shared by `checkHostedPeers` and `checkOptionalPeerImports`.
 * Runtime: node
 * Governing contract: ADR 0308; the 0.32.0 lazy-peer gap (BILLING-A, 2026-11-09).
 */

/** `import … from "<spec>"` and `export … from "<spec>"`, with what sits between the keyword and `from`. */
const FROM = /\b(import|export)\s+([^;]*?)\s+from\s+["']([^"']+)["']/g;

/** Whether an import or export clause brings in only types (`type X`, `{ type A, type B }`). */
function typesOnly(clause: string): boolean {
  if (/^type\b/.test(clause)) return true;
  const named = /^\{([^}]*)\}$/.exec(clause.trim())?.[1];
  if (named === undefined) return false;
  const items = named
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 && items.every((item) => item.startsWith("type "));
}

/**
 * The specifiers `source` imports a value from, in source order.
 *
 * @example
 * valueImportsOf('import { A } from "x";\nimport type { B } from "y";'); // ["x"]
 */
export function valueImportsOf(source: string): string[] {
  return [...source.matchAll(FROM)]
    .filter(([, , clause = ""]) => !typesOnly(clause))
    .map(([, , , spec = ""]) => spec);
}

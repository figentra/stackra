/**
 * Stackra file contract:
 * Purpose: `checkExports(exports)`, the ADR 0025 shape of a library's `exports`: a module entry is
 *          `{ "@stackra/source": "./src/….ts", types: "./dist/….d.mts", default: "./dist/….mjs" }` with the source
 *          condition first; a plain string entry is a static asset and must not name a module.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0025.
 */

const MODULE = /\.(ts|tsx|mts|js|mjs|cjs)$/;

/**
 * The findings for a `package.json` `exports` value.
 *
 * @param exports - the parsed `exports` field (a string, a map, or undefined).
 * @example
 * checkExports({ ".": "./src/index.ts" }); // one finding: a module named as a plain string
 */
export function checkExports(exports: unknown): string[] {
  const out: string[] = [];
  const entries: [string, unknown][] =
    typeof exports === "string" ? [[".", exports]] : Object.entries((exports ?? {}) as object);
  for (const [key, value] of entries) {
    if (typeof value === "string") {
      if (MODULE.test(value))
        out.push(
          `exports["${key}"] names a module as a plain string — use the @stackra/source/types/default shape (ADR 0025)`,
        );
      continue;
    }
    const target = value as Record<string, unknown> | null | undefined;
    const keys = Object.keys(target ?? {});
    const src = target?.["@stackra/source"];
    if (keys[0] !== "@stackra/source" || !/^\.\/src\/.+\.tsx?$/.test(String(src ?? "")))
      out.push(`exports["${key}"] must list "@stackra/source": "./src/….ts" first (ADR 0025)`);
    if (!/^\.\/dist\/.+\.d\.mts$/.test(String(target?.["types"] ?? "")))
      out.push(`exports["${key}"].types must be ./dist/….d.mts (ADR 0025)`);
    if (!/^\.\/dist\/.+\.mjs$/.test(String(target?.["default"] ?? "")))
      out.push(`exports["${key}"].default must be ./dist/….mjs (ADR 0025)`);
  }
  return out;
}

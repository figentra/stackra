/**
 * Stackra file contract:
 * Purpose: `collectSourceTargets(exports)`, every string a package `exports` map gives under the `@stackra/source`
 *          condition (at any depth): the `./src/` files a source-condition consumer would load.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */

/**
 * The source-condition targets.
 *
 * @param exports - a parsed package.json `exports` value.
 * @example
 * collectSourceTargets({ ".": { "@stackra/source": "./src/index.ts", default: "./dist/index.js" } }); // ["./src/index.ts"]
 */
export function collectSourceTargets(exports: unknown): string[] {
  if (typeof exports !== "object" || exports === null) return [];
  return Object.entries(exports).flatMap(([key, value]) => {
    if (key === "@stackra/source") return typeof value === "string" ? [value] : [];
    return collectSourceTargets(value);
  });
}

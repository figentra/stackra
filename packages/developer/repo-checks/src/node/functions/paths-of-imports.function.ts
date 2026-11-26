/**
 * Stackra file contract:
 * Purpose: `pathsOfImports(imports)`, the tsconfig `compilerOptions.paths` a service carries for its package.json
 *          `imports`: each key with its first target only. Encore's parser honours only the first `./` target of a
 *          `paths` key (the OS lane's identity app, 2026-11-10), and tsc probes extensions and `index` files through a
 *          path target (`moduleResolution: bundler`), so one target serves both.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0091 (decision 2, amendment of 2026-11-09, rule 4 as corrected 2026-11-10: Encore's parser
 *                     ignores package.json `imports`).
 */

/**
 * The `paths` map of an `imports` map; an entry whose target is neither a string nor a non-empty list of strings (a
 * conditional object) has no path form and is left out.
 *
 * @param imports - the package.json `imports` value.
 * @example
 * pathsOfImports({ "#src/*": ["./src/*", "./src/*.ts"] }); // { "#src/*": ["./src/*"] }
 */
export function pathsOfImports(imports: unknown): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  if (typeof imports !== "object" || imports === null) return out;
  for (const [key, target] of Object.entries(imports)) {
    if (typeof target === "string") out[key] = [target];
    else if (Array.isArray(target) && typeof target[0] === "string") out[key] = [target[0]];
  }
  return out;
}

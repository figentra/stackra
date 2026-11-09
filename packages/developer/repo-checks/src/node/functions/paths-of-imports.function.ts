/**
 * Stackra file contract:
 * Purpose: `pathsOfImports(imports)`, the tsconfig `compilerOptions.paths` a service carries for its package.json
 *          `imports`: each key and its target array, a string target a one-element array.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0091 (decision 2, amendment of 2026-11-09: Encore's parser ignores package.json `imports`).
 */

/**
 * The `paths` map of an `imports` map; an entry whose target is neither a string nor a list of strings (a
 * conditional object) has no path form and is left out.
 *
 * @param imports - the package.json `imports` value.
 * @example
 * pathsOfImports({ "#src/*": "./src/*" }); // { "#src/*": ["./src/*"] }
 */
export function pathsOfImports(imports: unknown): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  if (typeof imports !== "object" || imports === null) return out;
  for (const [key, target] of Object.entries(imports)) {
    if (typeof target === "string") out[key] = [target];
    else if (Array.isArray(target) && target.every((t) => typeof t === "string"))
      out[key] = target as string[];
  }
  return out;
}

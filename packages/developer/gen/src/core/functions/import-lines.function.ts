/**
 * Stackra file contract:
 * Purpose: `importLines`, the import block of a generated file from a map of module specifier to named imports, each
 *          marked type-only or not: one line per specifier, sorted by specifier and then by name, so two runs over the
 *          same input print the same bytes.
 * Boundary: pure. A specifier whose names are all type-only prints as `import type`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: gen output is stable); ADR 0261.
 */

/**
 * The import lines for `imports`.
 *
 * @param imports - module specifier to imported name to whether it is used as a type only.
 * @example
 * importLines(new Map([["zod", new Map([["z", false]])]])); // ['import { z } from "zod";']
 */
export function importLines(imports: ReadonlyMap<string, ReadonlyMap<string, boolean>>): string[] {
  return [...imports.entries()]
    .filter(([, names]) => names.size > 0)
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([from, names]) => {
      const sorted = [...names.entries()].sort(([left], [right]) => left.localeCompare(right));
      if (sorted.every(([, typeOnly]) => typeOnly))
        return `import type { ${sorted.map(([name]) => name).join(", ")} } from "${from}";`;
      const specifiers = sorted.map(([name, typeOnly]) => (typeOnly ? `type ${name}` : name));
      return `import { ${specifiers.join(", ")} } from "${from}";`;
    });
}

/**
 * Stackra file contract:
 * Purpose: `moduleEdges`, each own module of a member to the own modules it depends on: a constructor token that is
 *          a class of another own module, through a `#` import, sorted. Shared by the wiring, the manifest's module
 *          rows and the seeders' order (STA-2061).
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 24: sibling modules); ADR 0263 (module graph).
 */
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The module edges of `ir`.
 *
 * @param ir - the member read by discovery.
 * @example
 * moduleEdges(ir).get("orders"); // ["catalogue"]
 */
export function moduleEdges(ir: MemberIR): Map<string, string[]> {
  const moduleOf = new Map(ir.classes.map((declared) => [declared.name, declared.module]));
  const edges = new Map<string, string[]>();
  for (const key of ir.modules) {
    const dependsOn = new Set<string>();
    for (const declared of ir.classes.filter((candidate) => candidate.module === key))
      for (const dep of declared.deps) {
        const target = moduleOf.get(dep.class.name);
        if (target !== undefined && target !== key && dep.class.from.startsWith("#"))
          dependsOn.add(target);
      }
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    edges.set(key, [...dependsOn].sort());
  }
  return edges;
}

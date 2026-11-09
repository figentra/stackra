/**
 * Stackra file contract:
 * Purpose: `moduleDependsOn`, the modules a module of the member depends on: the owners of the `#`-imported classes its
 *          own classes take in their constructors, never itself.
 * Boundary: pure; reads the discovered IR. Shared by the manifest, the wiring and the migration order.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 24: a module reaches a sibling through its exported classes); ADR 0159.
 */
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The sorted module keys `key` depends on.
 *
 * @example
 * moduleDependsOn(ir, "billing"); // ["tenants"]
 */
export function moduleDependsOn(ir: MemberIR, key: string): string[] {
  const moduleOf = new Map(ir.classes.map((declared) => [declared.name, declared.module]));
  const dependsOn = new Set<string>();
  for (const declared of ir.classes.filter((candidate) => candidate.module === key))
    for (const dep of declared.deps) {
      const target = moduleOf.get(dep.class.name);
      if (target !== undefined && target !== key && dep.class.from.startsWith("#"))
        dependsOn.add(target);
    }
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  return [...dependsOn].sort();
}

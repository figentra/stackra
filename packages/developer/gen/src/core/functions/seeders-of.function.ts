/**
 * Stackra file contract:
 * Purpose: `seedersOf`, the own seeders of a member in module-dependency order, ties by file: each with its identity
 *          `<module>.<profile>` (the profile is the file stem before `.seeder.ts`, `minimal` when none). The manifest's
 *          `seeders` section and the seed entry read it (STA-2061).
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0190 (as amended by ADR 0294: profiles, identity, order by imports).
 */
import { moduleEdges } from "#core/functions/module-edges.function";
import { topological } from "#core/functions/topological.function";
import type { SeederRow } from "#core/types/seeder-row.type";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The own seeders of `ir` in module order.
 *
 * @param ir - the member read by discovery.
 * @example
 * seedersOf(ir).map((row) => row.key); // ["catalogue.demo", "orders.demo"]
 */
export function seedersOf(ir: MemberIR): SeederRow[] {
  const seeders = ir.classes.filter((declared) => declared.kind === "seeder");
  const order = topological(ir.modules, moduleEdges(ir));
  // A seeder of a module the IR does not list sorts last; the sort is stable, so ties keep file order.
  const rank = (module: string): number => {
    const at = order.indexOf(module);
    return at === -1 ? order.length : at;
  };
  return (
    seeders
      .map((declared, index) => ({ declared, index }))
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort(
        (left, right) =>
          rank(left.declared.module) - rank(right.declared.module) || left.index - right.index,
      )
      .map(({ declared }) => {
        const profile = /([a-z]+)\.seeder\.ts$/.exec(declared.file)?.[1] ?? "minimal";
        return {
          key: `${declared.module}.${profile}`,
          module: declared.module,
          profile,
          name: declared.name,
          file: declared.file,
          importPath: declared.importPath,
        };
      })
  );
}

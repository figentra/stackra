/**
 * Stackra file contract:
 * Purpose: `transitiveRefusals`: the refusals for every package the member's generated wiring needs through
 *          undeclared ones, so one run names the whole `package.json` addition instead of one layer per run.
 * Boundary: pure; reads `ir.transitiveDependencies`, which discovery fills from the manifests of undeclared packages
 *           (resolved from the package that brought each in). Nothing is emitted from an undeclared package.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 10: a broken run writes nothing); ADR 0003 (each member declares what it
 *                     imports); gen's AGENTS.md (undeclared packages).
 */
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The refusals for the packages reached from `seeds` (the undeclared packages the wiring imports directly) through
 * `ir.transitiveDependencies`, and one `package.json` hint holding every missing package as a line to paste. Empty
 * when nothing more is reached.
 *
 * @param ir - the member read by discovery.
 * @param seeds - the undeclared packages already refused.
 * @param code - the refusal code.
 */
export function transitiveRefusals(
  ir: MemberIR,
  seeds: readonly string[],
  code: string,
): GenError[] {
  const { specifier = "catalog:stackra", packages = [] } = ir.transitiveDependencies ?? {};
  const requires = new Map(packages.map((entry) => [entry.package, entry.requires]));
  const declared = new Set([...(ir.packages ?? []), ir.package]);
  const missing = new Set(seeds);
  const reached = new Map<string, string>();
  const queue = [...seeds];
  for (let next = queue.shift(); next !== undefined; next = queue.shift())
    for (const name of requires.get(next) ?? [])
      if (!declared.has(name) && !missing.has(name)) {
        missing.add(name);
        reached.set(name, next);
        queue.push(name);
      }
  if (reached.size === 0) return [];
  const error = (subject: string, message: string, fix: string): GenError => ({
    code,
    file: "package.json",
    line: 0,
    column: 0,
    subject,
    message,
    fix,
  });
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds
  const lines = [...missing].sort().map((name) => `"${name}": "${specifier}",`);
  return [
    ...[...reached]
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds
      .sort()
      .map(([name, via]) =>
        error(
          name,
          `the generated wiring needs ${name} (through ${via}), which ${ir.package} does not declare`,
          `add "${name}" to the dependencies in package.json`,
        ),
      ),
    error(
      "package.json",
      `${ir.package} needs ${missing.size} packages it does not declare for its generated wiring`,
      `add these to the dependencies in package.json:\n${lines.join("\n")}`,
    ),
  ];
}

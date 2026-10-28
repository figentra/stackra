/**
 * Stackra file contract:
 * Purpose: `planEditionInstall(bundle, modules, installed)`, an edition install for one tenant: the edition's modules
 *          and the base modules it bundles, in dependency order, the contributions that stay inert, or the issues that
 *          stop it.
 * Boundary: pure and deterministic: ties are taken in code-unit order. Never throws on untrusted input. A dependency
 *           must be planned or already installed; a module the edition does not bundle is never pulled in, because a
 *           base module outside the bundle is not available to the edition's tenants. An enhanced module is never
 *           required: its contribution is listed as inert until that module is installed.
 * Runtime: isomorphic
 * Governing contract: ADR 0335 (decisions 5 and 6); ADR 0214 (decision 3); ADR 0350 (decisions 4 and 5).
 */
import type { EditionBundle } from "#core/schemas/edition-bundle.schema";
import type { EditionInstallIssue } from "#core/types/edition-install-issue.type";
import type { EditionInstallPlan } from "#core/types/edition-install-plan.type";
import type { InstallableModule } from "#core/types/installable-module.type";

/** Code-unit order, never locale order. */
const byCodeUnit = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

/**
 * The install plan of `bundle` against the released `modules` for a tenant that has `installed`.
 *
 * @example
 * planEditionInstall(bundle, [...baseModules, ...editionModules], []);
 * // { install: ["catalog", "orders", "fashion_sizes"], inert: {}, issues: [] }
 */
export function planEditionInstall(
  bundle: Pick<EditionBundle, "modules" | "bundles">,
  modules: readonly InstallableModule[],
  installed: readonly string[],
): EditionInstallPlan {
  const known = new Map(modules.map((module) => [module.key, module]));
  const done = new Set(installed);
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  const wanted = [...new Set([...bundle.bundles, ...bundle.modules])].sort(byCodeUnit);
  const issues: EditionInstallIssue[] = [];
  const planned = new Map<string, InstallableModule>();
  for (const key of wanted) {
    const module = known.get(key);
    if (module === undefined)
      issues.push({
        code: "unknown_module",
        module: key,
        message: `"${key}" is in the bundle but no released manifest declares it`,
      });
    else if (!done.has(key)) planned.set(key, module);
  }
  for (const [key, module] of planned)
    for (const dependency of module.dependsOn)
      if (!planned.has(dependency) && !done.has(dependency))
        issues.push({
          code: "missing_dependency",
          module: key,
          message: `"${key}" depends on "${dependency}", which is neither bundled nor installed`,
        });

  const install: string[] = [];
  const waiting = new Map(
    [...planned].map(([key, module]) => [key, module.dependsOn.filter((d) => planned.has(d))]),
  );
  while (waiting.size > 0) {
    const ready = [...waiting]
      .filter(([, deps]) => deps.every((dependency) => install.includes(dependency)))
      .map(([key]) => key)
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort(byCodeUnit);
    if (ready.length === 0) {
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      const looped = [...waiting.keys()].sort(byCodeUnit);
      issues.push({
        code: "dependency_cycle",
        module: looped[0] as string,
        message: `${looped.map((key) => `"${key}"`).join(", ")} depend on each other in a loop`,
      });
      break;
    }
    for (const key of ready) {
      install.push(key);
      waiting.delete(key);
    }
  }

  const present = new Set([...done, ...planned.keys()]);
  const inert: Record<string, readonly string[]> = {};
  for (const [key, module] of planned) {
    const missing = (module.enhances ?? []).filter((target) => !present.has(target));
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    if (missing.length > 0) inert[key] = [...missing].sort(byCodeUnit);
  }
  return issues.length > 0 ? { install: [], inert: {}, issues } : { install, inert, issues };
}

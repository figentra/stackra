/**
 * Stackra file contract:
 * Purpose: `specDrift(context)`, the drift between a spec and the changed paths: members the diff changes that Impact
 *          does not name, ticked tasks whose paths are gone, and (Done) Impact doc pages the diff does not touch.
 * Boundary: pure; whether a path exists is injected.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */
import { specImpactOf } from "./spec-impact-of.function.ts";
import { specMemberOf } from "./spec-member-of.function.ts";
import { specParseTasks } from "./spec-parse-tasks.function.ts";
import { specStatusOf } from "./spec-status-of.function.ts";

/**
 * Problems of one spec against the diff. `named` holds the members another spec in the same diff already names (one
 * branch may carry many specs).
 *
 * @param context - the spec and tasks texts, the changed paths, a path-exists test and the already-named members.
 * @example
 * specDrift({ spec, tasks, changed: ["packages/a/b/src/x.ts"] });
 */
export function specDrift(context: {
  spec: string;
  tasks?: string;
  changed?: readonly string[];
  exists?: (path: string) => boolean;
  named?: ReadonlySet<string>;
  prefixes?: readonly string[];
}): string[] {
  const {
    spec,
    tasks = "",
    changed = [],
    exists = () => true,
    named = new Set<string>(),
    prefixes = [],
  } = context;
  const problems: string[] = [];
  const impact = specImpactOf(spec);
  const members = new Set(changed.map(specMemberOf).filter((m): m is string => m !== undefined));
  for (const m of members)
    if (!impact.includes(m) && !named.has(m))
      problems.push(`the diff changes \`${m}\`, which no spec in the diff names in its Impact`);
  for (const t of specParseTasks(tasks, prefixes).filter((x) => x.done && !x.struck))
    for (const p of t.paths)
      if (p.includes("/") && !/[[\]<>*]/.test(p) && !exists(p))
        problems.push(`${t.id} is ticked, but its path \`${p}\` does not exist`);
  if (specStatusOf(spec) === "done") {
    const docs = /^- \*\*Docs to update\*\*:(.*)$/m.exec(impact)?.[1] ?? "";
    for (const d of docs.match(/apps\/docs\/src\/[^\s`,;)]+/g) ?? [])
      if (!changed.includes(d))
        problems.push(`status done, but Impact's doc \`${d}\` is not touched by this diff`);
  }
  return problems;
}

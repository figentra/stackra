/**
 * Stackra file contract:
 * Purpose: `specCheckTasks(tasksText, context)`, the tasks lint of a tasks.md against its spec and plan: ids, covers,
 *          routes, deps, cycles, coverage and parallel waves.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */
import { specDefinedIds } from "./spec-defined-ids.function.ts";
import { specParseTasks } from "./spec-parse-tasks.function.ts";
import { specProperties } from "./spec-properties.function.ts";

/**
 * Problems of the tasks.md; `known` holds the routing.yaml task types (empty skips the route check).
 *
 * @param tasksText - the tasks.md text.
 * @param context - the spec and plan texts, the known task types and the issue prefixes.
 * @example
 * specCheckTasks("", {}); // ["tasks.md: no `- [ ] T###` task lines"]
 */
export function specCheckTasks(
  tasksText: string,
  context: {
    spec?: string;
    plan?: string;
    known?: ReadonlySet<string> | undefined;
    prefixes?: readonly string[];
  } = {},
): string[] {
  const { spec = "", plan = "", known = new Set<string>(), prefixes = [] } = context;
  const problems: string[] = [];
  const tasks = specParseTasks(tasksText, prefixes);
  if (!tasks.length) return ["tasks.md: no `- [ ] T###` task lines"];
  const ids = new Set(specDefinedIds(spec, "(?:FR|SC|EC|AC)").live);
  for (const p of specProperties(plan).keys()) ids.add(p);
  const seen = new Map<string, number>();
  for (const t of tasks) {
    if (seen.has(t.id)) problems.push(`tasks.md:${t.line}: ${t.id} repeats line ${seen.get(t.id)}`);
    seen.set(t.id, t.line);
  }
  const live = tasks.filter((t) => !t.struck);
  for (const t of live) {
    const at = `tasks.md:${t.line}: ${t.id}`;
    if (!t.covers.length) problems.push(`${at} has no \`covers:\``);
    for (const id of t.covers)
      if (!ids.has(id))
        problems.push(`${at} covers ${id}, which spec.md and plan.md do not define`);
    if (!t.route) problems.push(`${at} has no \`route:\``);
    else if (known.size && !known.has(t.route))
      problems.push(`${at} route \`${t.route}\` is not a task type in .agents/routing.yaml`);
    for (const d of t.deps)
      if (!seen.has(d)) problems.push(`${at} depends on ${d}, which does not exist`);
  }
  const deps = new Map(live.map((t) => [t.id, t.deps]));
  const state = new Map<string, "open" | "done">();
  const visit = (id: string, trail: readonly string[]): void => {
    if (state.get(id) === "done") return;
    if (state.get(id) === "open") {
      problems.push(`tasks.md: dependency cycle ${[...trail, id].join(" → ")}`);
      return;
    }
    state.set(id, "open");
    for (const d of deps.get(id) ?? []) visit(d, [...trail, id]);
    state.set(id, "done");
  };
  for (const id of deps.keys()) visit(id, []);
  const covered = new Set(live.flatMap((t) => t.covers));
  for (const fr of specDefinedIds(spec, "FR").live)
    if (!covered.has(fr)) problems.push(`tasks.md: ${fr} is covered by no task`);
  const waves = new Map<string, string>();
  for (const t of live.filter((x) => x.parallel))
    for (const path of t.paths) {
      const k = `${t.phase}\0${path}`;
      if (waves.has(k))
        problems.push(
          `tasks.md: [P] tasks ${waves.get(k)} and ${t.id} share \`${path}\` in one wave`,
        );
      else waves.set(k, t.id);
    }
  return problems;
}

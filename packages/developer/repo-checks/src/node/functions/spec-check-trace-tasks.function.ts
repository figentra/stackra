/**
 * Stackra file contract:
 * Purpose: `specCheckTraceTasks(tasks, spec, where, prefixes)`, the trace of a tiered spec's tasks: each live task
 *          covers at least one acceptance criterion the spec defines and names at least one file in backticks, and
 *          every criterion is covered by a task.
 * Boundary: pure; it adds to the tasks lint, which already checks ids, routes, dependencies and waves.
 * Runtime: node
 * Governing contract: ADR 0502 (spec tiers, EARS criteria and the design); ADR 0120. Loaded by plain Node from source
 *                     by core's `tools/scripts` wrappers, so it imports values by relative `.ts` paths and uses
 *                     erasable TypeScript only (ADR 0421 decision 2).
 */
import { specDefinedIds } from "./spec-defined-ids.function.ts";
import { specParseTasks } from "./spec-parse-tasks.function.ts";

/**
 * Problems of the tasks' trace to the acceptance criteria and files.
 *
 * @param tasks - the tasks text: tasks.md, or a small spec's `## Tasks` section.
 * @param spec - the spec.md text.
 * @param where - how to name the tasks in a problem.
 * @param prefixes - the repository's spec key prefixes.
 * @example
 * specCheckTraceTasks(tasks, spec, "tasks.md", ["sta"]);
 */
export function specCheckTraceTasks(
  tasks: string,
  spec: string,
  where: string,
  prefixes: readonly string[] = [],
): string[] {
  const criteria = specDefinedIds(spec, "AC").live;
  const live = specParseTasks(tasks, prefixes).filter((t) => !t.struck);
  if (live.length === 0) return [`${where}: no \`- [ ] T###\` task lines`];
  const problems: string[] = [];
  for (const t of live) {
    const at = `${where}:${t.line}: ${t.id}`;
    if (!t.covers.some((id) => criteria.has(id)))
      problems.push(`${at} covers no acceptance criterion (AC-###) of spec.md (ADR 0502)`);
    if (t.paths.length === 0) problems.push(`${at} names no file in backticks (ADR 0502)`);
  }
  const covered = new Set(live.flatMap((t) => t.covers));
  for (const ac of criteria)
    if (!covered.has(ac)) problems.push(`${where}: ${ac} is covered by no task`);
  return problems;
}

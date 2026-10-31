/**
 * Stackra file contract:
 * Purpose: `specTrace(context)`, the trace matrix of one spec folder: each live FR and P with its tasks and covering
 *          tests, each SC with its verification method.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */
import type { SpecTrace } from "../types/spec-trace.type.ts";
import { specCoversTags } from "./spec-covers-tags.function.ts";
import { specDefinedIds } from "./spec-defined-ids.function.ts";
import { specDefinedLines } from "./spec-defined-lines.function.ts";
import { specFolderOf } from "./spec-folder-of.function.ts";
import { specParseTasks } from "./spec-parse-tasks.function.ts";
import { specProperties } from "./spec-properties.function.ts";

/**
 * The matrix; `tests` is the concatenated text of the test files.
 *
 * @param context - the folder name and the spec, plan, tasks and tests texts.
 * @example
 * specTrace({ folder: "os-12-billing", spec, plan, tasks, tests }).frs;
 */
export function specTrace(context: {
  folder: string;
  spec: string;
  plan?: string;
  tasks?: string;
  tests?: string;
  prefixes?: readonly string[];
}): SpecTrace {
  const { folder, spec, plan = "", tasks = "", tests = "", prefixes = [] } = context;
  const parsed = specFolderOf(folder);
  const covered = new Set(
    parsed === undefined ? [] : specCoversTags(tests, `${parsed.prefix}-${parsed.number}`),
  );
  const live = specParseTasks(tasks, prefixes).filter((t) => !t.struck);
  const tasksFor = (id: string): string[] =>
    live.filter((t) => t.covers.includes(id)).map((t) => t.id);
  const props = specProperties(plan);
  const ps = [...props.keys()].map((id) => ({ id, tasks: tasksFor(id), tested: covered.has(id) }));
  const frs = [...specDefinedIds(spec, "FR").live].map((id) => {
    const via = ps.filter((p) => p.tested && props.get(p.id)?.includes(id)).map((p) => p.id);
    return { id, tasks: tasksFor(id), tested: covered.has(id), via };
  });
  const scLines = specDefinedLines(spec, "SC");
  const scs = [...specDefinedIds(spec, "SC").live].map((id) => ({
    id,
    method: /verified by:\s*([a-z0-9/ -]+)/i.exec(scLines.get(id) ?? "")?.[1]?.trim(),
  }));
  const acs = [...specDefinedIds(spec, "AC").live].map((id) => ({
    id,
    tasks: tasksFor(id),
    tested: covered.has(id),
  }));
  return { key: parsed?.number, frs, ps, scs, acs };
}

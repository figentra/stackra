/**
 * Stackra file contract:
 * Purpose: `purgeRuns(tables, ids)`, which removes runs with their steps, tool calls and approvals, children first, for
 *          a subject's erasure; it answers the runs that stay because a legal hold covers them or one of their rows.
 * Boundary: every purge runs in the caller's tenant session and unit of work, so an erasure is one transaction; `purge`
 *           itself skips held rows. A run with a child left behind stays, since the child references it.
 * Runtime: node
 * Governing contract: ADR 0100 (decision 9); ADR 0134 (holds and purge); OS ADR 0067 d12 (privacy erasure)
 */
import type { RunTables } from "#node/types/run-tables.type";

/**
 * Removes the runs `ids` and their children.
 *
 * @returns the ids of the runs that stay.
 */
export async function purgeRuns(
  tables: RunTables,
  ids: readonly string[],
): Promise<ReadonlySet<string>> {
  if (ids.length === 0) return new Set();
  const children = { runId: { $in: ids } } as never;
  await tables.steps.purge(children);
  await tables.calls.purge(children);
  await tables.decisions.purge(children);
  const kept = new Set<string>();
  for (const row of await tables.steps.find(children)) kept.add(row.runId);
  for (const row of await tables.calls.find(children)) kept.add(row.runId);
  for (const row of await tables.decisions.find(children)) kept.add(row.runId);
  const free = ids.filter((id) => !kept.has(id));
  if (free.length > 0) await tables.runs.purge({ id: { $in: free } } as never);
  for (const row of await tables.runs.find({ id: { $in: ids } } as never)) kept.add(row.id);
  return kept;
}

/**
 * Stackra file contract:
 * Purpose: `reachableConnections`, the records the running call reaches, in lookup order: for each of the
 *          Integration's levels, the user's own for `User`, then for `Scope` those on the call's scope node and on
 *          each node above it, nearest first. Each tier is one level and one owner, so `find` takes the first tier and
 *          refuses one that holds several.
 * Boundary: internal and pure; both store drivers use it. A scope matches by its materialised path: a node serves the
 *           nodes below it (`a.b` serves `a.b` and `a.b.c`), so no level name is read (ADR 0327 decisions 2 and 3).
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 9 and 10); ADR 0327 (decisions 3 and 5).
 */
import type { ConnectionContext } from "#contracts/ports/connection-context.port";
import { ConnectionLevel } from "#core/enums/connection-level.enum";
import type { ConnectionRecord } from "#core/types/connection-record.type";

/** Whether the node at `ancestor` is the node at `path` or above it. */
const covers = (ancestor: string, path: string): boolean =>
  path === ancestor || path.startsWith(`${ancestor}.`);

/**
 * The tiers of records the call reaches, empty tiers left out.
 *
 * @example
 * const [first] = reachableConnections(records, [ConnectionLevel.User, ConnectionLevel.Scope], context);
 */
export function reachableConnections<R extends ConnectionRecord>(
  records: readonly R[],
  levels: readonly ConnectionLevel[],
  context: ConnectionContext,
): { readonly level: ConnectionLevel; readonly records: readonly R[] }[] {
  const tiers: { readonly level: ConnectionLevel; readonly records: readonly R[] }[] = [];
  for (const level of levels) {
    if (level === ConnectionLevel.User) {
      const user = context.user();
      if (user !== undefined)
        tiers.push({
          level,
          records: records.filter((record) => record.level === level && record.userId === user),
        });
      continue;
    }
    const scope = context.scope();
    if (scope === undefined) continue;
    const above = records.filter(
      (record) =>
        record.level === level &&
        record.scope !== undefined &&
        covers(record.scope.path, scope.path),
    );
    const paths = [...new Set(above.map((record) => record.scope?.path ?? ""))].sort(
      (a, b) => b.length - a.length,
    );
    for (const path of paths)
      tiers.push({ level, records: above.filter((record) => record.scope?.path === path) });
  }
  return tiers.filter((tier) => tier.records.length > 0);
}

/**
 * Stackra file contract:
 * Purpose: `partitionKey(scope, partition)`, the storage key segment of one partition: the principal, then the active
 *          scope's id when `QueryConfig.scope` keys by it.
 * Boundary: internal to the cache and the queue; pure. A signed-out partition is `anonymous`, which no public id can
 *           spell (a public id holds an underscore), so it never collides with a principal.
 * Runtime: isomorphic
 * Governing contract: ADR 0059 (cached personal data); R-59 (`ScopeRef`).
 */
import { QueryScope } from "#core/enums/query-scope.enum";
import type { QueryPartition } from "#core/types/query-partition.type";

/**
 * The key segment of `partition` under `scope`.
 *
 * @example
 * partitionKey(QueryScope.ActiveScope, { principal: "usr_1", scope: { id: "scp_wsp2", path: "platform.wsp2" } });
 * // "usr_1.scp_wsp2"
 */
export function partitionKey(scope: QueryScope, partition: QueryPartition): string {
  const principal = partition.principal ?? "anonymous";
  if (scope !== QueryScope.ActiveScope || partition.scope === null) return principal;
  return `${principal}.${partition.scope.id}`;
}

/**
 * Stackra file contract:
 * Purpose: `QueryScope`, what the query cache and the offline queue are keyed by (`QueryConfig.scope`): the signed-in
 *          principal and the active scope, or the principal alone.
 * Boundary: an `Enum.of` value plus the type of the same name. The active scope is the contracts `ScopeRef` the host
 *           opens the cache and the queue with; its level is data the owning package contributes, so no level name is
 *           spelled here (R-59). Both cases key by the principal, so a second user of the device never reads the
 *           first one's cache or replays their queue.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: the Enum row); ADR 0231 (snake_case codes); ADR 0059 (cached personal
 *                     data); R-59 (scope vocabulary).
 */
import { Enum } from "@stackra/contracts";

/**
 * What the cache and the queue are keyed by.
 *
 * @example
 * export class QueryConfig extends BaseQueryConfig {
 *   override scope: QueryScope = QueryScope.ActiveScope;
 * }
 */
export const QueryScope = Enum.of({
  /** The principal and the active scope: a switch of scope never shows another scope's data or replays its queue. */
  ActiveScope: "active_scope",
  /** The principal alone: one cache and one queue across every scope the principal works in. */
  Principal: "principal",
});

/** One of the codes above. */
export type QueryScope = Enum.Value<typeof QueryScope>;

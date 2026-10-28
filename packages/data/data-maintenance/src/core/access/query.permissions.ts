/**
 * Stackra file contract:
 * Purpose: `QueryPermissions`, the permissions of the `query` maintenance jobs: `data_maintenance.query.<verb>`.
 *          `record` is what `RecordSearchQueryAction` (`query.record`) derives, so gen's `permission_unknown` passes.
 * Boundary: statics only; the value is the risk and nothing else. Keys are derived from the module, the class (minus
 *           `Permissions`) and the static. System-held: the job runs as the system actor and no role may grant it. This
 *           add-on sits above @stackra/iam and @stackra/search, so it imports `Permissions` from iam; neither depends
 *           on it (ADR 0462 decision 1).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0132 as amended; ADR 0099 (risk); ADR 0462 (decision 1);
 *                     data-layer gap se12 (stackra-326).
 */
import { Permission, Permissions } from "@stackra/iam";

/**
 * Referenced as `QueryPermissions.record`.
 *
 * @example
 * export class RecordSearchQueryAction extends Action({ key: "query.record", actors: [ActorKind.System] }) {}
 */
export class QueryPermissions extends Permissions {
  /** Append one sampled search read or click to the query log; a reversible write, held only by the platform. */
  static readonly record = Permission.L2.system();
}

/**
 * Stackra file contract:
 * Purpose: `TimeseriesPermissions`, the permissions of the `timeseries` maintenance jobs:
 *          `data_maintenance.timeseries.<verb>`. `rollup` is what `RollUpTimeSeriesAction` (`timeseries.rollup`)
 *          derives, so gen's `permission_unknown` passes.
 * Boundary: statics only; the value is the risk and nothing else. Keys are derived from the module, the class (minus
 *           `Permissions`) and the static. System-held: the job runs as the system actor and no role may grant it. This
 *           add-on sits above @stackra/iam and @stackra/database, so it imports `Permissions` from iam; neither depends
 *           on it (ADR 0462 decision 1).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0132 as amended; ADR 0099 (risk); ADR 0462 (decision 1);
 *                     data-layer gap cdc7 (stackra-321).
 */
import { Permission, Permissions } from "@stackra/iam";

/**
 * Referenced as `TimeseriesPermissions.rollup`.
 *
 * @example
 * export class RollUpTimeSeriesAction extends Action({ key: "timeseries.rollup", actors: [ActorKind.System] }) {}
 */
export class TimeseriesPermissions extends Permissions {
  /**
   * Rewrite the recent rollup buckets and delete those past their grain's retention; destructive (an expired bucket
   * may outlive its raw rows, so it cannot be rebuilt), held only by the platform.
   */
  static readonly rollup = Permission.L4.system();
}

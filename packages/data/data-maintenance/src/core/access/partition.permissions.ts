/**
 * Stackra file contract:
 * Purpose: `PartitionPermissions`, the permissions of the `partition` maintenance jobs:
 *          `data_maintenance.partition.<verb>`. `maintain` is what `MaintainPartitionsAction` (`partition.maintain`)
 *          derives, so gen's `permission_unknown` passes.
 * Boundary: statics only; the value is the risk and nothing else. Keys are derived from the module, the class (minus
 *           `Permissions`) and the static. System-held: the job runs as the system actor and no role may grant it. This
 *           add-on sits above @stackra/iam and @stackra/database, so it imports `Permissions` from iam; neither depends
 *           on it (ADR 0462 decision 1).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0132 as amended; ADR 0099 (risk); ADR 0462 (decision 1);
 *                     data-layer gaps db12, sc4; ADR 0134 (holds).
 */
import { Permission, Permissions } from "@stackra/iam";

/**
 * Referenced as `PartitionPermissions.maintain`.
 *
 * @example
 * export class MaintainPartitionsAction extends Action({ key: "partition.maintain", actors: [ActorKind.System] }) {}
 */
export class PartitionPermissions extends Permissions {
  /** Create partitions ahead and drop expired ones whole; irreversible, held only by the platform. */
  static readonly maintain = Permission.L4.system();
}

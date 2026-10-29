/**
 * Stackra file contract:
 * Purpose: `RecordPermissions`, the permissions of the `record` maintenance jobs: `data_maintenance.record.<verb>`.
 *          `prune` is what `PruneRecordsAction` (`record.prune`) derives, so gen's `permission_unknown` passes.
 * Boundary: statics only; the value is the risk and nothing else. Keys are derived from the module, the class (minus
 *           `Permissions`) and the static. System-held: the job runs as the system actor and no role may grant it. This
 *           add-on sits above @stackra/iam and @stackra/database, so it imports `Permissions` from iam; neither depends
 *           on it (ADR 0462 decision 1).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0132 as amended; ADR 0099 (risk); ADR 0462 (decision 1); ADR
 *                     0134 (decision 3); ADR 0189 (decision 4).
 */
import { Permission, Permissions } from "@stackra/iam";

/**
 * Referenced as `RecordPermissions.prune`.
 *
 * @example
 * export class PruneRecordsAction extends Action({ key: "record.prune", actors: [ActorKind.System] }) {}
 */
export class RecordPermissions extends Permissions {
  /** Archive, soft-delete or delete expired rows; irreversible, held only by the platform. */
  static readonly prune = Permission.L4.system();
}

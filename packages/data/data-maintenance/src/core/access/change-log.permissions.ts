/**
 * Stackra file contract:
 * Purpose: `ChangeLogPermissions`, the permissions of the `change_log` maintenance jobs:
 *          `data_maintenance.change_log.<verb>`. `maintain` is what `MaintainChangeLogAction` (`change_log.maintain`)
 *          derives, so gen's `permission_unknown` passes.
 * Boundary: statics only; the value is the risk and nothing else. Keys are derived from the module, the class (minus
 *           `Permissions`) and the static. System-held: the job runs as the system actor and no role may grant it. This
 *           add-on sits above @stackra/iam and @stackra/outbox, so it imports `Permissions` from iam; neither depends
 *           on it (ADR 0462 decision 1).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0132 as amended; ADR 0099 (risk); ADR 0462 (decision 1); ADR
 *                     0078; ADR 0221 (2026-10-28 amendment).
 */
import { Permission, Permissions } from "@stackra/iam";

/**
 * Referenced as `ChangeLogPermissions.maintain`.
 *
 * @example
 * export class MaintainChangeLogAction extends Action({ key: "change_log.maintain", actors: [ActorKind.System] }) {}
 */
export class ChangeLogPermissions extends Permissions {
  /** Make the change log's next partitions and drop expired ones whole; irreversible, held only by the platform. */
  static readonly maintain = Permission.L4.system();
}

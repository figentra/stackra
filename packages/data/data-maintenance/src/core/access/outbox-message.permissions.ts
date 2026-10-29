/**
 * Stackra file contract:
 * Purpose: `OutboxMessagePermissions`, the permissions of the `outbox_message` maintenance jobs:
 *          `data_maintenance.outbox_message.<verb>`. `prune` is what `PruneOutboxAction` (`outbox_message.prune`)
 *          derives, so gen's `permission_unknown` passes.
 * Boundary: statics only; the value is the risk and nothing else. Keys are derived from the module, the class (minus
 *           `Permissions`) and the static. System-held: the job runs as the system actor and no role may grant it. This
 *           add-on sits above @stackra/iam and @stackra/outbox, so it imports `Permissions` from iam; neither depends
 *           on it (ADR 0462 decision 1).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0132 as amended; ADR 0099 (risk); ADR 0462 (decision 1);
 *                     data-layer gap gov6; ADR 0078 (decision 4).
 */
import { Permission, Permissions } from "@stackra/iam";

/**
 * Referenced as `OutboxMessagePermissions.prune`.
 *
 * @example
 * export class PruneOutboxAction extends Action({ key: "outbox_message.prune", actors: [ActorKind.System] }) {}
 */
export class OutboxMessagePermissions extends Permissions {
  /** Delete old dead letters and inbox ids; irreversible, held only by the platform. */
  static readonly prune = Permission.L4.system();
}

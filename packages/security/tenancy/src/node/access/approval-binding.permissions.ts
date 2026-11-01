/**
 * Stackra file contract:
 * Purpose: `ApprovalBindingPermissions`, the permissions of the tenancy module's `approval_binding` aggregate:
 *          `tenancy.approval_binding.prune`, which `PruneApprovalBindingsAction` runs under.
 * Boundary: declarations only. Pruning deletes approval bindings, which are audit evidence, and cannot be undone, so it
 *           is L4 and a system permission: held only by the platform, never grantable to a tenant role (the action's
 *           own actor check also refuses a caller that is not System).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0132 as amended; ADR 0099 (risk); ADR 0513 (the vocabulary
 *                     comes from contracts and container, not iam); ADR 0509; STA-1890.
 */
import { Permissions } from "@stackra/container";
import { Permission } from "@stackra/contracts";

/**
 * Referenced as `ApprovalBindingPermissions.prune` by the prune action.
 *
 * @example
 * ApprovalBindingPermissions.prune.isSystem; // true
 */
export class ApprovalBindingPermissions extends Permissions {
  /** Delete approval bindings past their retention: an irreversible delete of audit evidence. */
  static readonly prune = Permission.L4.system();
}

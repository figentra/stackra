/**
 * Stackra file contract:
 * Purpose: `AccountDeletionPermissions`, the permissions of deleting one's own account: `identity.account_deletion.<verb>`,
 *          each with its risk. `request`, `cancel` and `read` are what the signed-in user's actions and query derive,
 *          `erase` what the job that starts due erasures derives, so gen's `permission_unknown` passes.
 * Boundary: statics only; the value is the risk and nothing else. Keys are derived from the module, the class (minus
 *           `Permissions`) and the static. Declared here, above @stackra/iam, as ADR 0462 asks of a package with its
 *           own actions: iam keeps the `Permissions` base and knows nothing of identity. `erase` is system-held: the
 *           job runs as the system actor and no role grants it.
 * Runtime: isomorphic
 * Governing contract: ADR 0462; ADR 0294 (decisions 16 and 20); ADR 0132 as amended; ADR 0099 (risk); STA-1567.
 */
import { Permission, Permissions } from "@stackra/iam";

/**
 * The account deletion verbs.
 *
 * @example
 * export class DeleteMyAccountAction extends Action({ key: "account_deletion.request", actors: [ActorKind.User] }) {}
 */
export class AccountDeletionPermissions extends Permissions {
  /** Schedule the deletion of one's own account; L4, as it ends in an erasure with no undo. */
  static readonly request = Permission.L4;

  /** Cancel one's own scheduled deletion; L2, a reversible write. */
  static readonly cancel = Permission.L2;

  /** Read one's own scheduled deletion; L1. */
  static readonly read = Permission.L1;

  /** Start the erasure of the accounts whose grace period ended; destructive, held only by the platform. */
  static readonly erase = Permission.L4.system();
}

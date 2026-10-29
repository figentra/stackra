/**
 * Stackra file contract:
 * Purpose: `HoldPermissions`, the permissions of a legal hold: `privacy.hold.<verb>`, each with its risk. `place` is
 *          what `PlaceHoldAction` (`hold.place`) derives, `release` what `ReleaseHoldAction` (`hold.release`) derives
 *          and `read` what `ListHoldsQuery` (`hold.list`) derives, so gen's `permission_unknown` passes.
 * Boundary: statics only; the value is the risk and nothing else. Keys are derived from the module, the class (minus
 *           `Permissions`) and the static. Not system permissions: a product grants them to its compliance role.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0132 as amended; ADR 0099 (risk); ADR 0134 (2026-10-24
 *                     amendment: holds).
 */
import { Permission, Permissions } from "@stackra/iam";

/**
 * Referenced as `HoldPermissions.place`, `HoldPermissions.release` and `HoldPermissions.read`.
 *
 * @example
 * export class PlaceHoldAction extends Action({ key: "hold.place", actors: [ActorKind.User, ActorKind.Service] }) {}
 */
export class HoldPermissions extends Permissions {
  /** Place a legal hold; a reversible write that only blocks deletion. */
  static readonly place = Permission.L2;

  /** Release a legal hold; privileged, as it lets retention and erasure delete the held records again. */
  static readonly release = Permission.L4;

  /** List the tenant's legal holds; a read that reveals which records are under a matter. */
  static readonly read = Permission.L1;
}

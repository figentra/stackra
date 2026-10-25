/**
 * Stackra file contract:
 * Purpose: `LoyaltyAccountPermissions`, the permissions of the loyalty account model: `loyalty_kit.loyalty_account.<verb>`,
 *          each with its risk.
 * Boundary: statics only; the value is the risk and nothing else. Keys are derived from the module, the class (minus
 *           `Permissions`) and the static, and labels are the derived i18n keys
 *           `loyalty_kit::permissions.loyalty_account.<verb>`. The kit's action keys name other aggregates (`account`,
 *           `points`), so each action and query names its permission; `LoyaltyAccountPolicy` refines a verb per record.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0132 as amended; ADR 0208 (names); ADR 0099 (risk).
 */
import { Permission, Permissions } from "@stackra/iam";

/**
 * Referenced as `LoyaltyAccountPermissions.redeem` by actions, queries and widgets.
 *
 * @example
 * export class RedeemPointsAction extends Action({ key: "points.redeem", permission: LoyaltyAccountPermissions.redeem, ... }) {}
 */
export class LoyaltyAccountPermissions extends Permissions {
  /** Read a balance; the policy narrows a customer to their own account. */
  static readonly read = Permission.L0;

  /** Enroll a principal; a customer may only enroll themselves. */
  static readonly enroll = Permission.L1;

  /** Freeze or unfreeze an account for review; L2, so a person confirms it first. */
  static readonly freeze = Permission.L2;

  /** Spend points; the policy limits a customer to their own account and refuses a frozen one. */
  static readonly redeem = Permission.L1;

  /** Expire stale points in bulk; held only by the platform, so no role may grant it. */
  static readonly expire = Permission.L2.system();
}

/**
 * Stackra file contract:
 * Purpose: `ViewPermissions`, the permissions of saved views: `panel.view.<verb>`, each with its risk.
 * Boundary: statics only; the value is the risk and nothing else. Keys are derived from the module, the class (minus
 *           `Permissions`) and the static; labels are the derived i18n keys `panel::permissions.view.<verb>`. Keeping a
 *           private view needs nothing beyond the resource's list permission; sharing one with a role or the whole scope
 *           needs `share`, L1, as it changes what others see first.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 9: `panel.view.share`); ADR 0271 (decision 3); ADR 0294 (decisions 16 and 20);
 *                     ADR 0099 (risk).
 */
import { Permission, Permissions } from "@stackra/iam";

/**
 * Referenced as `ViewPermissions.share`.
 *
 * @example
 * await pdp.check(actor, ViewPermissions.share, { scope });
 */
export class ViewPermissions extends Permissions {
  /** Share a saved view with a role or the whole scope; L1. */
  static readonly share = Permission.L1;
}

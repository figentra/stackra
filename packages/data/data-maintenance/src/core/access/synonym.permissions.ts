/**
 * Stackra file contract:
 * Purpose: `SynonymPermissions`, the permissions of the synonym model: `data_maintenance.synonym.<verb>`, each with its risk.
 * Boundary: statics only; the value is the risk and nothing else. Keys are derived from the module (`data_maintenance`), the class
 *           (minus `Permissions`) and the static, and labels are the derived i18n keys
 *           `data_maintenance::permissions.synonym.<verb>`, in every locale of this package. A synonym changes what a tenant's
 *           shoppers find, so writes are L1 and a delete is L2 (a person confirms it, an agent needs approval).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0132 as amended; ADR 0208 (names); ADR 0099 (risk); ADR 0492
 *                     (decision 5).
 */
import { Permission, Permissions } from "@stackra/iam";

/**
 * Referenced as `SynonymPermissions.create` by the synonym actions and query.
 *
 * @example
 * export class CreateSynonymAction extends Action({ key: "synonym.create", permission: SynonymPermissions.create }) {}
 */
export class SynonymPermissions extends Permissions {
  /** See the tenant's synonym sets. */
  static readonly read = Permission.L0;

  /** Add a synonym set. */
  static readonly create = Permission.L1;

  /** Change a synonym set's terms. */
  static readonly update = Permission.L1;

  /** Remove a synonym set; L2, so a person confirms it first. */
  static readonly delete = Permission.L2;
}

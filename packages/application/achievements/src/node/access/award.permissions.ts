/**
 * Stackra file contract:
 * Purpose: `AwardPermissions`, the permissions of the award model: `achievements.award.<verb>`, each with its risk.
 * Boundary: statics only; the value is the risk and nothing else. Keys are derived from the module, the class (minus
 *           `Permissions`) and the static, and labels are the derived i18n keys `achievements::permissions.award.<verb>`.
 *           `read` is the permission `VerifyAwardQuery` derives (a query reads `<module>.<model>.read`); the query runs
 *           in the public area, so anyone may check a certificate.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0132 as amended; ADR 0099 (risk); ADR 0432 (decision 1).
 */
import { Permission, Permissions } from "@stackra/iam";

/**
 * The award verbs; `VerifyAwardQuery` derives `achievements.award.read` from `read`.
 *
 * @example
 * export class VerifyAwardQuery extends Query({ key: "award.verify", area: ApiArea.Public, ... }) {}
 */
export class AwardPermissions extends Permissions {
  /** Check an award by its token or code; L0, as it reveals only what the certificate already shows. */
  static readonly read = Permission.L0;
}

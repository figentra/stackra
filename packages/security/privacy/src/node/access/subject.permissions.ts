/**
 * Stackra file contract:
 * Purpose: `SubjectPermissions`, the permissions of a data subject: `privacy.subject.<verb>`, each with its risk.
 *          `erase` is what `EraseSubjectAction` (`subject.erase`) derives and `export` what `ExportSubjectDataAction`
 *          (`subject.export`) derives, so gen's `permission_unknown` passes (STA-1299).
 * Boundary: statics only; the value is the risk and nothing else. Keys are derived from the module, the class (minus
 *           `Permissions`) and the static. Both are system permissions no role grants: the jobs run as the system
 *           actor.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0132 as amended; ADR 0099 (risk); ADR 0189.
 */
import { Permission, Permissions } from "@stackra/iam";

/**
 * Referenced as `SubjectPermissions.erase` and `SubjectPermissions.export`.
 *
 * @example
 * export class EraseSubjectAction extends Action({ key: "subject.erase", actors: [ActorKind.System] }) {}
 */
export class SubjectPermissions extends Permissions {
  /** Erase one subject's personal data; destructive and without undo, held only by the platform. */
  static readonly erase = Permission.L4.system();

  /** Export one subject's personal data (the DSAR copy); a read, held only by the platform. */
  static readonly export = Permission.L1.system();
}

/**
 * Stackra file contract:
 * Purpose: `SubjectExportPermissions`, the permissions of a DSAR export file: `privacy.subject_export.<verb>`.
 *          `purge` is what `PurgeSubjectExportsAction` (`subject_export.purge`) derives, so gen's `permission_unknown`
 *          passes (STA-1299).
 * Boundary: statics only; the value is the risk and nothing else. Keys are derived from the module, the class (minus
 *           `Permissions`) and the static. A system permission no role grants: the nightly job runs as the system
 *           actor.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0132 as amended; ADR 0099 (risk); ADR 0189.
 */
import { Permission, Permissions } from "@stackra/iam";

/**
 * Referenced as `SubjectExportPermissions.purge`.
 *
 * @example
 * export class PurgeSubjectExportsAction extends Action({ key: "subject_export.purge", actors: [ActorKind.System] }) {}
 */
export class SubjectExportPermissions extends Permissions {
  /** Delete export files past their window; irreversible, held only by the platform. */
  static readonly purge = Permission.L4.system();
}

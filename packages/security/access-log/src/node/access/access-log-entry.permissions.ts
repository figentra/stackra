/**
 * Stackra file contract:
 * Purpose: `AccessLogEntryPermissions`, the permissions of the access record model: `access_log.access_log_entry.<verb>`,
 *          each with its risk.
 * Boundary: statics only; the value is the risk and nothing else. Keys are derived from the module, the class (minus
 *           `Permissions`) and the static; labels are the derived i18n keys
 *           `access_log::permissions.access_log_entry.<verb>`.
 *           `purge` is the permission `PurgeAccessLogAction` (`access_log_entry.purge`) derives; it deletes records, so
 *           it is L2 and a system permission no role may grant: only the platform's nightly job holds it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0132 as amended; ADR 0099 (risk).
 */
import { Permission, Permissions } from "@stackra/iam";

/**
 * Referenced as `AccessLogEntryPermissions.purge`.
 *
 * @example
 * AccessLogEntryPermissions.purge; // L2, system
 */
export class AccessLogEntryPermissions extends Permissions {
  /** Delete the records the retention window no longer keeps; held only by the platform. */
  static readonly purge = Permission.L2.system();
}

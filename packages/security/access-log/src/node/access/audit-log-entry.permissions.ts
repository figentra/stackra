/**
 * Stackra file contract:
 * Purpose: `AuditLogEntryPermissions`, the permissions of the write audit model: `access_log.audit_log_entry.<verb>`,
 *          each with its risk.
 * Boundary: statics only; the value is the risk and nothing else. Keys are derived from the module, the class (minus
 *           `Permissions`) and the static; labels are the derived i18n keys
 *           `access_log::permissions.audit_log_entry.<verb>`. `read` is the permission `AuditQuery` derives; it shows
 *           who did what in the tenant, so it is L1. There is no write verb: only `PostgresAuditTrailDriver` inserts.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0132 as amended; ADR 0099 (risk); ADR 0465 (decision 4).
 */
import { Permission, Permissions } from "@stackra/iam";

/**
 * Referenced as `AuditLogEntryPermissions.read`.
 *
 * @example
 * export class AuditQuery extends Query({ key: "audit_log_entry.search", permission: AuditLogEntryPermissions.read }) {}
 */
export class AuditLogEntryPermissions extends Permissions {
  /** Read the tenant's write audit; L1, as it reveals who acted and how. */
  static readonly read = Permission.L1;
}

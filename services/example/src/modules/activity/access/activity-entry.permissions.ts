/**
 * Stackra file contract:
 * Purpose: `ActivityEntryPermissions`, the permissions of the activity feed: `activity.activity_entry.<verb>`, each with
 *          its risk.
 * Boundary: statics only; the value is the risk. `activity_entry.list` takes `read`; `activity_entry.prune`, the
 *           retention job, takes `prune`, which only the system actor holds in practice (the job has no endpoint and no
 *           tool).
 * Runtime: isomorphic
 * Governing contract: ADR 0294; ADR 0208 (names); ADR 0099 (risk).
 */
import { Permission, Permissions } from "@stackra/iam";

/** Read by the feed query and the retention job. */
export class ActivityEntryPermissions extends Permissions {
  /** Read the tenant's activity feed. */
  static readonly read = Permission.L0;

  /** Delete feed entries past their retention, for good. */
  static readonly prune = Permission.L2;
}

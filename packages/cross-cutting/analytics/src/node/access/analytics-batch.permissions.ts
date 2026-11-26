/**
 * Stackra file contract:
 * Purpose: `AnalyticsBatchPermissions`, the permission of the ingest action (`analytics.analytics_batch.ingest`, ADR
 *          0483 decision 4): every visitor may hand the analytics service a batch of its own events.
 * Boundary: a permissions class only; L2 (a write, STA-2096), grantable. Consent, not this permission, decides what is
 *           sent on (decision 2).
 * Runtime: node
 * Governing contract: ADR 0483 (decision 4); ADR 0208 (permission names); ADR 0294 (decision 20).
 */
import { Permission, Permissions } from "@stackra/iam";

/**
 * Referenced as `AnalyticsBatchPermissions.ingest`.
 *
 * @example
 * AnalyticsBatchPermissions.ingest; // L2, grantable
 */
export class AnalyticsBatchPermissions extends Permissions {
  /** Hand the analytics service a batch of one's own analytics events; open to every visitor. */
  static readonly ingest = Permission.L2;
}

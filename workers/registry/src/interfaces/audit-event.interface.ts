/**
 * Stackra file contract:
 * Purpose: `AuditEvent`: one `audit_events` row to write.
 * Boundary: SQL over the D1 binding only; no rule is decided here. Writes that belong together go in one D1 batch
 *           (one transaction). The licence tables are stackra-183's.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 3); migrations/0001_registry.sql.
 */

/** One `audit_events` row to write. */
export interface AuditEvent {
  /** When the action happened, as an ISO 8601 timestamp. */
  readonly at: string;
  /** The registry action the row records. */
  readonly action: "publish" | "deprecate" | "dist-tag.set" | "dist-tag.delete" | "token.exchange";
  /** The full package name the action touched. */
  readonly name: string;
  /** The version the action touched, or null when it touched none. */
  readonly version?: string | null;
  /** The dist-tag the action set or deleted, or null for other actions. */
  readonly tag?: string | null;
  /** Who acted, such as `ci:<owner>/<repo>` for a trusted publisher. */
  readonly actor: string;
  /** The GitHub Actions run URL that performed the action. */
  readonly run: string;
  /** Free text that explains the action, or null when nothing more is worth saying. */
  readonly detail?: string | null;
}

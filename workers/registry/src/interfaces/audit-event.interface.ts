/**
 * Stackra file contract:
 * Purpose: `AuditEvent`: one `audit_events` row to write.
 * Boundary: SQL over the D1 binding only; no rule is decided here. Writes that belong together go in one D1 batch
 *           (one transaction). The licence tables are stackra-183's.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decision 3); migrations/0001_registry.sql.
 */

/** One `audit_events` row to write. */
export interface AuditEvent {
  readonly at: string;
  readonly action: "publish" | "deprecate" | "dist-tag.set" | "dist-tag.delete" | "token.exchange";
  readonly name: string;
  readonly version?: string | null;
  readonly tag?: string | null;
  readonly actor: string;
  readonly run: string;
  readonly detail?: string | null;
}

/**
 * Stackra file contract:
 * Purpose: `AuditLink`, one stored audit record with its place in its tenant's hash chain: sequence, the hash of the
 *          link before it and its own hash, so a changed, removed or reordered record breaks verification.
 * Boundary: a type in the leaf entry. The audit chain is its own chain, apart from the access-log chain (two tables,
 *           two heads), but built and verified the same way: `linkAuditEntry` builds a link, `findAuditChainBreak`
 *           checks a run.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decision 3: tamper evidence by a hash chain); ADR 0465 (decision 4).
 */
import type { AuditRecord } from "#contracts/types/audit-record.type";

/** An audit record as stored, chained. */
export interface AuditLink extends AuditRecord {
  /** The link's position in its chain, from 1, with no gaps. */
  readonly sequence: number;

  /** The `hash` of the link before it; 64 zeros for the first link of a chain. */
  readonly previousHash: string;

  /** SHA-256, lowercase hex, of `previousHash`, `sequence` and the record as canonical JSON. */
  readonly hash: string;
}

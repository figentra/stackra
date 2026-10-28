/**
 * Stackra file contract:
 * Purpose: `hashAuditLink`, the hash of one audit chain link: SHA-256, lowercase hex, over the previous link's hash, the
 *          sequence and the audit record's fields as canonical JSON.
 * Boundary: internal to the package (`linkAuditEntry` and `findAuditChainBreak` share it, so building and verifying
 *           never drift). The canonical form is `@stackra/support`'s `canonicalHash`, the one the access chain and the
 *           audit service use. Web Crypto only.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decision 3: a hash chain); ADR 0416 (one canonical form).
 */
import { canonicalHash } from "@stackra/support";

import type { AuditRecord } from "#contracts/types/audit-record.type";

/**
 * The hash of the link that puts `record` at `sequence` after the link whose hash is `previousHash`.
 *
 * @param record - the audit record; only its record fields are read.
 * @param sequence - the link's position in its chain.
 * @param previousHash - the hash of the link before it.
 * @returns 64 lowercase hex characters.
 */
export function hashAuditLink(
  record: AuditRecord,
  sequence: number,
  previousHash: string,
): Promise<string> {
  return canonicalHash([
    previousHash,
    sequence,
    record.callId,
    record.key,
    record.permission,
    record.risk,
    record.effects,
    record.actor,
    record.scopeId,
    record.scopePath,
    record.originKind,
    record.originId,
    record.outcome,
    record.code,
    record.fields,
    record.at,
  ]);
}

/**
 * Stackra file contract:
 * Purpose: `hashAccessLink`, the hash of one chain link: SHA-256, lowercase hex, over the previous link's hash, the
 *          sequence and the record's fields as canonical JSON.
 * Boundary: internal to the package (`linkAccessRecord` and `findChainBreak` share it, so building and verifying never
 *           drift). The canonical form and the hash are `@stackra/support`'s `canonicalHash` (object keys sorted at
 *           every depth, absent fields dropped, dates as ISO 8601), byte for byte the form this package used before,
 *           so every stored chain still verifies, and the audit service and offline verifiers hash the same way. Web
 *           Crypto only, so it runs in Node, a browser and a worker.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decision 3: a hash chain); ADR 0416 (one canonical form, STA-827); STA-821.
 */
import { canonicalHash } from "@stackra/support";

import type { AccessRecord } from "#contracts/types/access-record.type";

/**
 * The hash of the link that puts `record` at `sequence` after the link whose hash is `previousHash`.
 *
 * @param record - the access record; only its record fields are read.
 * @param sequence - the link's position in its chain.
 * @param previousHash - the hash of the link before it.
 * @returns 64 lowercase hex characters.
 */
export function hashAccessLink(
  record: AccessRecord,
  sequence: number,
  previousHash: string,
): Promise<string> {
  return canonicalHash([
    previousHash,
    sequence,
    record.callId,
    record.actor,
    record.target,
    record.classification,
    record.subjects,
    record.at,
  ]);
}

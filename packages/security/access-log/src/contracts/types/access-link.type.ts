/**
 * Stackra file contract:
 * Purpose: `AccessLink`, one stored access record with its place in the hash chain: its sequence, the hash of the link
 *          before it and its own hash, so a changed, removed or reordered record breaks verification.
 * Boundary: a type in the leaf entry. A chain is one per tenant in Postgres (the rows its policy shows) and one per
 *           memory sink; `linkAccessRecord` builds a link and `findChainBreak` checks a run of them.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decision 3: tamper evidence by a hash chain); ADR 0294 (decision 15).
 */
import type { AccessRecord } from "#contracts/types/access-record.type";

/** An access record as stored, chained. */
export interface AccessLink extends AccessRecord {
  /** The link's position in its chain, from 1, with no gaps. */
  readonly sequence: number;

  /** The `hash` of the link before it; 64 zeros for the first link of a chain. */
  readonly previousHash: string;

  /** SHA-256, lowercase hex, of `previousHash`, `sequence` and the record as canonical JSON. */
  readonly hash: string;
}

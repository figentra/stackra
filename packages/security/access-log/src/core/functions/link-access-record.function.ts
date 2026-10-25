/**
 * Stackra file contract:
 * Purpose: `linkAccessRecord`, the next link of a hash chain: the record with the sequence after `previous`, the hash
 *          of `previous` and its own hash. Every sink chains its records with it, a host's own sink included.
 * Boundary: a pure function over Web Crypto; it reads no store, so the sink that calls it owns the head it passes and
 *           the order of its writes. The first link of a chain follows 64 zeros.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decision 3: a hash chain per tenant, checked by verification).
 */
import type { AccessLink } from "#contracts/types/access-link.type";
import type { AccessRecord } from "#contracts/types/access-record.type";
import { hashAccessLink } from "#core/functions/hash-access-link.function";

/** The `previousHash` of a chain's first link. */
const GENESIS_HASH = "0".repeat(64);

/**
 * Chains `record` after `previous`, or starts a chain.
 *
 * @param record - the record to append; only its record fields are kept.
 * @param previous - the chain's newest link; absent for a new chain.
 * @returns the link to store.
 * @example
 * const link = await linkAccessRecord(record, this.links.at(-1));
 */
export async function linkAccessRecord(
  record: AccessRecord,
  previous?: Pick<AccessLink, "sequence" | "hash">,
): Promise<AccessLink> {
  const sequence = (previous?.sequence ?? 0) + 1;
  const previousHash = previous?.hash ?? GENESIS_HASH;
  return {
    callId: record.callId,
    actor: record.actor,
    target: record.target,
    classification: record.classification,
    subjects: record.subjects,
    at: record.at,
    sequence,
    previousHash,
    hash: await hashAccessLink(record, sequence, previousHash),
  };
}
